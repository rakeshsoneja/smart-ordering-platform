const { query } = require('../database/dbConnection');

/**
 * Product Model - Handles all database operations for products
 */

// Get all products
const getAllProducts = async (filters = {}) => {
  let selectQuery = 'SELECT * FROM products WHERE 1=1';
  const values = [];
  let paramIndex = 1;

  // Filter by status if provided
  if (filters.status) {
    selectQuery += ` AND status = $${paramIndex}`;
    values.push(filters.status);
    paramIndex++;
  }

  // Filter by category if provided
  if (filters.category) {
    selectQuery += ` AND category = $${paramIndex}`;
    values.push(filters.category);
    paramIndex++;
  }

  selectQuery += ' ORDER BY created_at DESC';
  
  const result = await query(selectQuery, values);
  return result.rows;
};

// Get product by ID
const getProductById = async (productId) => {
  const selectQuery = 'SELECT * FROM products WHERE id = $1';
  const result = await query(selectQuery, [productId]);
  return result.rows[0];
};

// Create a new product
const createProduct = async (productData) => {
  const {
    name,
    description,
    price,
    unit,
    unitValue,
    image,
    category,
    status = 'active',
  } = productData;

  const insertQuery = `
    INSERT INTO products (
      name,
      description,
      price,
      unit,
      unit_value,
      image,
      category,
      status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;

  const values = [
    name,
    description || null,
    price,
    unit,
    unitValue || 1,
    image || null,
    category,
    status,
  ];

  const result = await query(insertQuery, values);
  return result.rows[0];
};

// Update product
const updateProduct = async (productId, productData) => {
  const {
    name,
    description,
    price,
    unit,
    unitValue,
    image,
    category,
    status,
  } = productData;

  const updateFields = [];
  const values = [];
  let paramIndex = 1;

  if (name !== undefined) {
    updateFields.push(`name = $${paramIndex}`);
    values.push(name);
    paramIndex++;
  }

  if (description !== undefined) {
    updateFields.push(`description = $${paramIndex}`);
    values.push(description);
    paramIndex++;
  }

  if (price !== undefined) {
    updateFields.push(`price = $${paramIndex}`);
    values.push(price);
    paramIndex++;
  }

  if (unit !== undefined) {
    updateFields.push(`unit = $${paramIndex}`);
    values.push(unit);
    paramIndex++;
  }

  if (unitValue !== undefined) {
    updateFields.push(`unit_value = $${paramIndex}`);
    values.push(unitValue);
    paramIndex++;
  }

  if (image !== undefined) {
    updateFields.push(`image = $${paramIndex}`);
    values.push(image);
    paramIndex++;
  }

  if (category !== undefined) {
    updateFields.push(`category = $${paramIndex}`);
    values.push(category);
    paramIndex++;
  }

  if (status !== undefined) {
    updateFields.push(`status = $${paramIndex}`);
    values.push(status);
    paramIndex++;
  }

  if (updateFields.length === 0) {
    // No fields to update, return existing product
    return await getProductById(productId);
  }

  values.push(productId);
  const updateQuery = `
    UPDATE products 
    SET ${updateFields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;

  const result = await query(updateQuery, values);
  return result.rows[0];
};

// Delete product (soft delete by setting status to disabled)
const deleteProduct = async (productId) => {
  const updateQuery = `
    UPDATE products 
    SET status = 'disabled'
    WHERE id = $1
    RETURNING *
  `;
  const result = await query(updateQuery, [productId]);
  return result.rows[0];
};

// Hard delete product (permanent removal)
const hardDeleteProduct = async (productId) => {
  const deleteQuery = 'DELETE FROM products WHERE id = $1 RETURNING *';
  const result = await query(deleteQuery, [productId]);
  return result.rows[0];
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  hardDeleteProduct,
};

