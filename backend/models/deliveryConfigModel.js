const { query } = require('../database/dbConnection');

/**
 * Delivery Config Model - Handles all database operations for delivery configuration
 */

const normalizeStateCode = (value) => {
  if (typeof value !== 'string') return null;
  const v = value.trim().toUpperCase();
  return v === '' ? null : v;
};

const normalizeStateName = (value) => {
  if (typeof value !== 'string') return null;
  const v = value.trim();
  return v === '' ? null : v;
};

const deactivateCompetingConfigs = async (stateCode, excludeConfigId = null) => {
  const values = [];
  const conditions = ['is_active = true'];

  if (stateCode) {
    values.push(stateCode);
    conditions.push(`state_code = $${values.length}`);
  } else {
    conditions.push('state_code IS NULL');
  }

  if (excludeConfigId != null) {
    values.push(excludeConfigId);
    conditions.push(`config_id != $${values.length}`);
  }

  const sql = `UPDATE delivery_config SET is_active = false WHERE ${conditions.join(' AND ')}`;
  await query(sql, values);
};

// Get active delivery config
const getActiveDeliveryConfig = async () => {
  const selectQuery = `
    SELECT * FROM delivery_config
    WHERE is_active = true AND state_code IS NULL
    LIMIT 1
  `;
  const result = await query(selectQuery, []);
  if (result.rows[0]) return result.rows[0];

  // Backward compatibility: if no active global exists, return latest active config
  const legacyQuery = `
    SELECT * FROM delivery_config
    WHERE is_active = true
    ORDER BY created_at DESC
    LIMIT 1
  `;
  const legacy = await query(legacyQuery, []);
  return legacy.rows[0] || null;
};

const getActiveGlobalDeliveryConfig = async () => {
  const result = await query(
    `
      SELECT * FROM delivery_config
      WHERE is_active = true AND state_code IS NULL
      ORDER BY created_at DESC
      LIMIT 1
    `,
    []
  );
  return result.rows[0] || null;
};

const getActiveDeliveryConfigByStateCode = async (stateCode) => {
  const normalizedStateCode = normalizeStateCode(stateCode);
  if (!normalizedStateCode) return null;
  const result = await query(
    `
      SELECT * FROM delivery_config
      WHERE is_active = true AND state_code = $1
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [normalizedStateCode]
  );
  return result.rows[0] || null;
};

const getEffectiveDeliveryConfig = async (stateCode) => {
  const stateConfig = await getActiveDeliveryConfigByStateCode(stateCode);
  if (stateConfig) {
    return stateConfig;
  }
  const globalConfig = await getActiveGlobalDeliveryConfig();
  if (globalConfig) {
    return globalConfig;
  }
  // Backward compatibility: fallback to legacy active config selection
  const legacyConfig = await getActiveDeliveryConfig();
  return legacyConfig;
};

const hasActiveStateConfig = async (stateCode, excludeConfigId = null) => {
  const normalizedStateCode = normalizeStateCode(stateCode);
  if (!normalizedStateCode) return false;
  const values = [normalizedStateCode];
  let sql = `
    SELECT 1 FROM delivery_config
    WHERE is_active = true AND state_code = $1
  `;
  if (excludeConfigId != null) {
    values.push(excludeConfigId);
    sql += ` AND config_id != $2`;
  }
  sql += ` LIMIT 1`;
  const result = await query(sql, values);
  return result.rowCount > 0;
};

// Get all delivery configs
const getAllDeliveryConfigs = async () => {
  const selectQuery = `
    SELECT * FROM delivery_config 
    ORDER BY
      CASE WHEN state_code IS NULL THEN 0 ELSE 1 END ASC,
      state_name ASC NULLS FIRST,
      is_active DESC,
      created_at DESC
  `;
  const result = await query(selectQuery, []);
  return result.rows;
};

// Get delivery config by ID
const getDeliveryConfigById = async (configId) => {
  const selectQuery = 'SELECT * FROM delivery_config WHERE config_id = $1';
  const result = await query(selectQuery, [configId]);
  return result.rows[0] || null;
};

// Create a new delivery config
const createDeliveryConfig = async (configData) => {
  const {
    weightUnitGrams,
    chargeAmount,
    isActive = false,
    stateCode = null,
    stateName = null,
  } = configData;
  const normalizedStateCode = normalizeStateCode(stateCode);
  const normalizedStateName = normalizeStateName(stateName);

  // If setting as active, deactivate other active configs in the same scope (state-specific or global)
  if (isActive) {
    await deactivateCompetingConfigs(normalizedStateCode, null);
  }
  const insertQuery = `
    INSERT INTO delivery_config (
      weight_unit_grams,
      charge_amount,
      is_active,
      state_code,
      state_name
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;

  const values = [
    weightUnitGrams,
    chargeAmount,
    isActive,
    normalizedStateCode,
    normalizedStateName,
  ];

  const result = await query(insertQuery, values);
  return result.rows[0];
};

// Update delivery config
const updateDeliveryConfig = async (configId, configData) => {
  const {
    weightUnitGrams,
    chargeAmount,
    isActive,
    stateCode,
    stateName,
  } = configData;
  const existing = await getDeliveryConfigById(configId);
  if (!existing) return null;

  const nextStateCode =
    stateCode !== undefined ? normalizeStateCode(stateCode) : normalizeStateCode(existing.state_code);
  const nextStateName =
    stateName !== undefined ? normalizeStateName(stateName) : normalizeStateName(existing.state_name);

  const updateFields = [];
  const values = [];
  let paramIndex = 1;

  if (weightUnitGrams !== undefined) {
    updateFields.push(`weight_unit_grams = $${paramIndex}`);
    values.push(weightUnitGrams);
    paramIndex++;
  }

  if (chargeAmount !== undefined) {
    updateFields.push(`charge_amount = $${paramIndex}`);
    values.push(chargeAmount);
    paramIndex++;
  }

  if (isActive !== undefined) {
    updateFields.push(`is_active = $${paramIndex}`);
    values.push(isActive);
    paramIndex++;
  }

  if (stateCode !== undefined) {
    updateFields.push(`state_code = $${paramIndex}`);
    values.push(nextStateCode);
    paramIndex++;
  }

  if (stateName !== undefined) {
    updateFields.push(`state_name = $${paramIndex}`);
    values.push(nextStateName);
    paramIndex++;
  }

  if (updateFields.length === 0) {
    return await getDeliveryConfigById(configId);
  }

  if (isActive === true || (isActive === undefined && existing.is_active === true && stateCode !== undefined)) {
    await deactivateCompetingConfigs(nextStateCode, configId);
  }

  values.push(configId);
  const updateQuery = `
    UPDATE delivery_config 
    SET ${updateFields.join(', ')}
    WHERE config_id = $${paramIndex}
    RETURNING *
  `;

  const result = await query(updateQuery, values);
  return result.rows[0] || null;
};

// Delete delivery config (hard delete)
const deleteDeliveryConfig = async (configId) => {
  const deleteQuery = 'DELETE FROM delivery_config WHERE config_id = $1 RETURNING *';
  const result = await query(deleteQuery, [configId]);
  return result.rows[0] || null;
};

module.exports = {
  getActiveDeliveryConfig,
  getActiveGlobalDeliveryConfig,
  getActiveDeliveryConfigByStateCode,
  getEffectiveDeliveryConfig,
  hasActiveStateConfig,
  getAllDeliveryConfigs,
  getDeliveryConfigById,
  createDeliveryConfig,
  updateDeliveryConfig,
  deleteDeliveryConfig,
};

