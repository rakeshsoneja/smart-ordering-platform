const { query } = require('../database/dbConnection');

/**
 * Delivery Config Model - Handles all database operations for delivery configuration
 */

// Get active delivery config
const getActiveDeliveryConfig = async () => {
  const selectQuery = `
    SELECT * FROM delivery_config 
    WHERE is_active = true 
    ORDER BY created_at DESC 
    LIMIT 1
  `;
  const result = await query(selectQuery, []);
  return result.rows[0] || null;
};

// Get all delivery configs
const getAllDeliveryConfigs = async () => {
  const selectQuery = `
    SELECT * FROM delivery_config 
    ORDER BY is_active DESC, created_at DESC
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
  } = configData;

  // If setting as active, deactivate all other configs
  if (isActive) {
    await query(
      'UPDATE delivery_config SET is_active = false WHERE is_active = true',
      []
    );
  }

  const insertQuery = `
    INSERT INTO delivery_config (
      weight_unit_grams,
      charge_amount,
      is_active
    )
    VALUES ($1, $2, $3)
    RETURNING *
  `;

  const values = [
    weightUnitGrams,
    chargeAmount,
    isActive,
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
  } = configData;

  // If setting as active, deactivate all other configs
  if (isActive) {
    await query(
      'UPDATE delivery_config SET is_active = false WHERE is_active = true AND config_id != $1',
      [configId]
    );
  }

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
    
    // If setting as active, deactivate all other configs
    if (isActive) {
      await query(
        'UPDATE delivery_config SET is_active = false WHERE is_active = true AND config_id != $1',
        [configId]
      );
    }
  }

  if (updateFields.length === 0) {
    return await getDeliveryConfigById(configId);
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
  getAllDeliveryConfigs,
  getDeliveryConfigById,
  createDeliveryConfig,
  updateDeliveryConfig,
  deleteDeliveryConfig,
};

