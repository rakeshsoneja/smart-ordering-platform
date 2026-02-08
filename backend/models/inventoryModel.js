const { query } = require('../database/dbConnection');

/**
 * Inventory Model - Handles all database operations for product inventory
 * Inventory is maintained at PRODUCT level (not variant level)
 * All variants share the same product inventory
 */

// Get inventory by product ID
const getInventoryByProductId = async (productId) => {
  const selectQuery = `
    SELECT * FROM product_inventory 
    WHERE product_id = $1
    LIMIT 1
  `;
  const result = await query(selectQuery, [productId]);
  return result.rows[0];
};

// Get inventory by inventory ID
const getInventoryById = async (inventoryId) => {
  const selectQuery = 'SELECT * FROM product_inventory WHERE inventory_id = $1';
  const result = await query(selectQuery, [inventoryId]);
  return result.rows[0];
};

// Create or update inventory (product level only)
const upsertInventory = async (inventoryData) => {
  const {
    productId,
    availableQuantityGrams,
  } = inventoryData;

  const upsertQuery = `
    INSERT INTO product_inventory (
      product_id,
      available_quantity_grams
    )
    VALUES ($1, $2)
    ON CONFLICT (product_id)
    DO UPDATE SET
      available_quantity_grams = EXCLUDED.available_quantity_grams,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `;

  const values = [
    productId,
    availableQuantityGrams,
  ];

  const result = await query(upsertQuery, values);
  return result.rows[0];
};

// Update inventory quantity (add or subtract grams)
const updateInventoryQuantity = async (productId, quantityChangeGrams) => {
  const updateQuery = `
    UPDATE product_inventory
    SET available_quantity_grams = available_quantity_grams + $1,
        updated_at = CURRENT_TIMESTAMP
    WHERE product_id = $2
    RETURNING *
  `;

  const result = await query(updateQuery, [quantityChangeGrams, productId]);
  return result.rows[0];
};

// Atomically deduct inventory (with row-level locking)
// requestedQuantityGrams: total grams to deduct
// Returns { success: true/false, availableQuantityGrams, requestedQuantityGrams }
const deductInventoryAtomically = async (productId, requestedQuantityGrams) => {
  // Use SELECT FOR UPDATE to lock the row, then update
  const lockQuery = `
    SELECT * FROM product_inventory
    WHERE product_id = $1
    FOR UPDATE
  `;

  const lockResult = await query(lockQuery, [productId]);
  
  if (lockResult.rows.length === 0) {
    // No inventory record exists - treat as in stock (backward compatibility)
    return { success: true, availableQuantityGrams: null };
  }

  const inventory = lockResult.rows[0];
  const currentQuantityGrams = parseInt(inventory.available_quantity_grams) || 0;

  if (currentQuantityGrams < requestedQuantityGrams) {
    return { 
      success: false, 
      availableQuantityGrams: currentQuantityGrams,
      requestedQuantityGrams 
    };
  }

  // Perform atomic update
  const updateQuery = `
    UPDATE product_inventory
    SET available_quantity_grams = available_quantity_grams - $1,
        updated_at = CURRENT_TIMESTAMP
    WHERE product_id = $2
      AND available_quantity_grams >= $1
    RETURNING *
  `;

  const updateResult = await query(updateQuery, [requestedQuantityGrams, productId]);
  
  if (updateResult.rows.length === 0) {
    // Update failed - inventory was insufficient (race condition)
    return { 
      success: false, 
      availableQuantityGrams: currentQuantityGrams,
      requestedQuantityGrams 
    };
  }

  return { 
    success: true, 
    availableQuantityGrams: parseInt(updateResult.rows[0].available_quantity_grams),
    inventory: updateResult.rows[0]
  };
};

// Deduct inventory for multiple items atomically (within a transaction)
// Inventory is maintained at PRODUCT LEVEL (shared across all variants)
// Groups cart items by product_id and calculates total grams per product
// Returns { success: true } if all deductions successful, { success: false, failedItems: [...] } otherwise
const deductInventoryForOrder = async (cartItems) => {
  // Start transaction
  await query('BEGIN');

  try {
    const failedItems = [];
    
    // Group cart items by product_id
    // Key: productId, Value: array of items for that product
    const itemsByProduct = {};
    
    for (const item of cartItems) {
      const { variantId, quantity } = item;
      
      // Get product ID
      let productId = item.productId || item.id;
      
      // Get variant weight if variant exists
      let variantWeightGrams = null;
      if (variantId) {
        // Get product ID and weight from variant
        const variantQuery = 'SELECT variant_weight_grams, product_id FROM product_variant WHERE variant_id = $1';
        const variantResult = await query(variantQuery, [variantId]);
        if (variantResult.rows.length > 0) {
          productId = variantResult.rows[0].product_id;
          variantWeightGrams = variantResult.rows[0].variant_weight_grams;
        } else {
          // Variant not found - add to failed items
          failedItems.push({
            productId: null,
            variantId,
            requestedQuantityGrams: 0,
            availableQuantityGrams: 0,
          });
          continue;
        }
      }
      
      if (!productId) {
        // No product ID available - add to failed items
        failedItems.push({
          productId: null,
          variantId,
          requestedQuantityGrams: 0,
          availableQuantityGrams: 0,
        });
        continue;
      }
      
      // Initialize product group if not exists
      if (!itemsByProduct[productId]) {
        itemsByProduct[productId] = [];
      }
      
      // Add item to product group
      itemsByProduct[productId].push({
        variantId,
        quantity,
        variantWeightGrams,
      });
    }

    // If we already have failed items (invalid variants), rollback
    if (failedItems.length > 0) {
      await query('ROLLBACK');
      return { success: false, failedItems };
    }

    // For each product, calculate total requested grams across ALL variants
    for (const productId in itemsByProduct) {
      const productItems = itemsByProduct[productId];
      let totalRequestedGrams = 0;
      
      // Sum up grams from all variants of this product
      for (const item of productItems) {
        const { variantWeightGrams, quantity } = item;
        
        if (variantWeightGrams) {
          // For variant-based products, multiply quantity by variant weight
          totalRequestedGrams += quantity * variantWeightGrams;
        } else {
          // Legacy products without variants - quantity is already in base units
          // For backward compatibility, assume quantity is in grams
          totalRequestedGrams += quantity;
        }
      }

      // Deduct total grams for this product atomically
      const result = await deductInventoryAtomically(parseInt(productId), totalRequestedGrams);
      
      if (!result.success) {
        // Get product name for error message
        const { getProductById } = require('./productModel');
        const product = await getProductById(parseInt(productId));
        const productName = product ? product.name : 'Product';
        
        failedItems.push({
          productId: parseInt(productId),
          variantId: null, // Product-level failure
          productName,
          requestedQuantityGrams: totalRequestedGrams,
          availableQuantityGrams: result.availableQuantityGrams,
        });
      }
    }

    if (failedItems.length > 0) {
      // Rollback transaction
      await query('ROLLBACK');
      return { success: false, failedItems };
    }

    // Commit transaction
    await query('COMMIT');
    return { success: true };
  } catch (error) {
    // Rollback on error
    await query('ROLLBACK');
    throw error;
  }
};

// Delete inventory record
const deleteInventory = async (inventoryId) => {
  const deleteQuery = 'DELETE FROM product_inventory WHERE inventory_id = $1 RETURNING *';
  const result = await query(deleteQuery, [inventoryId]);
  return result.rows[0];
};

// Get inventory status for a product
// Returns { availableQuantityGrams, isOutOfStock }
// If no inventory record exists, returns null (treated as in stock)
const getInventoryStatus = async (productId) => {
  const inventory = await getInventoryByProductId(productId);
  
  if (!inventory) {
    return null; // No inventory record - treat as in stock
  }

  const availableQuantityGrams = parseInt(inventory.available_quantity_grams) || 0;
  return {
    availableQuantityGrams,
    isOutOfStock: availableQuantityGrams <= 0,
  };
};

module.exports = {
  getInventoryByProductId,
  getInventoryById,
  upsertInventory,
  updateInventoryQuantity,
  deductInventoryAtomically,
  deductInventoryForOrder,
  deleteInventory,
  getInventoryStatus,
};
