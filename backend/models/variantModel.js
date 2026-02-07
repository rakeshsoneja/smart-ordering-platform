const { query } = require('../database/dbConnection');

/**
 * Variant Model - Handles all database operations for product variants
 */

// Get all variants for a product
const getVariantsByProductId = async (productId, includeInactive = false) => {
  let selectQuery = `
    SELECT * FROM product_variant 
    WHERE product_id = $1
  `;
  const values = [productId];
  
  if (!includeInactive) {
    selectQuery += ' AND is_active = true';
  }
  
  selectQuery += ' ORDER BY is_default_variant DESC, variant_weight_grams ASC NULLS LAST, variant_name ASC';
  
  const result = await query(selectQuery, values);
  return result.rows;
};

// Get variant by ID
const getVariantById = async (variantId) => {
  const selectQuery = 'SELECT * FROM product_variant WHERE variant_id = $1';
  const result = await query(selectQuery, [variantId]);
  return result.rows[0];
};

// Get default variant for a product
const getDefaultVariantByProductId = async (productId) => {
  const selectQuery = `
    SELECT * FROM product_variant 
    WHERE product_id = $1 AND is_default_variant = true AND is_active = true
    LIMIT 1
  `;
  const result = await query(selectQuery, [productId]);
  return result.rows[0];
};

// Create a new variant
const createVariant = async (variantData) => {
  const {
    productId,
    variantName,
    variantWeightGrams,
    variantPrice,
    isDefaultVariant = false,
    isActive = true,
  } = variantData;

  // If this is set as default, unset other defaults for the same product
  if (isDefaultVariant) {
    await query(
      'UPDATE product_variant SET is_default_variant = false WHERE product_id = $1',
      [productId]
    );
  }

  const insertQuery = `
    INSERT INTO product_variant (
      product_id,
      variant_name,
      variant_weight_grams,
      variant_price,
      is_default_variant,
      is_active
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;

  const values = [
    productId,
    variantName,
    variantWeightGrams || null,
    variantPrice,
    isDefaultVariant,
    isActive,
  ];

  const result = await query(insertQuery, values);
  return result.rows[0];
};

// Update variant
const updateVariant = async (variantId, variantData) => {
  const {
    variantName,
    variantWeightGrams,
    variantPrice,
    isDefaultVariant,
    isActive,
  } = variantData;

  // If setting as default, unset other defaults for the same product
  if (isDefaultVariant) {
    const variant = await getVariantById(variantId);
    if (variant) {
      await query(
        'UPDATE product_variant SET is_default_variant = false WHERE product_id = $1 AND variant_id != $2',
        [variant.product_id, variantId]
      );
    }
  }

  const updateFields = [];
  const values = [];
  let paramIndex = 1;

  if (variantName !== undefined) {
    updateFields.push(`variant_name = $${paramIndex}`);
    values.push(variantName);
    paramIndex++;
  }

  if (variantWeightGrams !== undefined) {
    updateFields.push(`variant_weight_grams = $${paramIndex}`);
    values.push(variantWeightGrams || null);
    paramIndex++;
  }

  if (variantPrice !== undefined) {
    updateFields.push(`variant_price = $${paramIndex}`);
    values.push(variantPrice);
    paramIndex++;
  }

  if (isDefaultVariant !== undefined) {
    updateFields.push(`is_default_variant = $${paramIndex}`);
    values.push(isDefaultVariant);
    paramIndex++;
  }

  if (isActive !== undefined) {
    updateFields.push(`is_active = $${paramIndex}`);
    values.push(isActive);
    paramIndex++;
  }

  if (updateFields.length === 0) {
    return await getVariantById(variantId);
  }

  values.push(variantId);
  const updateQuery = `
    UPDATE product_variant 
    SET ${updateFields.join(', ')}
    WHERE variant_id = $${paramIndex}
    RETURNING *
  `;

  const result = await query(updateQuery, values);
  return result.rows[0];
};

// Delete variant (soft delete by setting is_active to false)
const deleteVariant = async (variantId) => {
  const updateQuery = `
    UPDATE product_variant 
    SET is_active = false
    WHERE variant_id = $1
    RETURNING *
  `;
  const result = await query(updateQuery, [variantId]);
  return result.rows[0];
};

// Hard delete variant (permanent removal)
const hardDeleteVariant = async (variantId) => {
  const deleteQuery = 'DELETE FROM product_variant WHERE variant_id = $1 RETURNING *';
  const result = await query(deleteQuery, [variantId]);
  return result.rows[0];
};

// Create default variant for a product (used in migration)
const createDefaultVariantForProduct = async (product) => {
  // Generate variant name from existing product unit and unit_value
  const variantName = product.unit === 'pc'
    ? `${product.unit_value} ${product.unit_value === 1 ? 'pc' : 'pcs'}`
    : `${product.unit_value}g`;

  // Calculate weight in grams if unit is grams
  const variantWeightGrams = product.unit === 'gms' ? product.unit_value : null;

  const variantData = {
    productId: product.id,
    variantName,
    variantWeightGrams,
    variantPrice: product.price,
    isDefaultVariant: true,
    isActive: true,
  };

  return await createVariant(variantData);
};

module.exports = {
  getVariantsByProductId,
  getVariantById,
  getDefaultVariantByProductId,
  createVariant,
  updateVariant,
  deleteVariant,
  hardDeleteVariant,
  createDefaultVariantForProduct,
};

