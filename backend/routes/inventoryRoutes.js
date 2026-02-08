const express = require('express');
const router = express.Router();
const {
  getInventoryByProductId,
  getInventoryById,
  upsertInventory,
  updateInventoryQuantity,
  deleteInventory,
} = require('../models/inventoryModel');

/**
 * Inventory Routes
 * Handles inventory management operations (product-level only)
 */

/**
 * GET /api/inventory/product/:productId
 * Get inventory record for a product
 */
router.get('/product/:productId', async (req, res, next) => {
  try {
    const productId = parseInt(req.params.productId);

    if (isNaN(productId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID',
      });
    }

    const inventory = await getInventoryByProductId(productId);

    if (!inventory) {
      return res.json({
        success: true,
        inventory: [],
      });
    }

    res.json({
      success: true,
      inventory: [{
        inventoryId: inventory.inventory_id,
        productId: inventory.product_id,
        availableQuantityGrams: parseInt(inventory.available_quantity_grams) || 0,
        createdAt: inventory.created_at,
        updatedAt: inventory.updated_at,
      }],
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/inventory
 * Create or update inventory (product-level only)
 */
router.post('/', async (req, res, next) => {
  try {
    const { productId, availableQuantityGrams } = req.body;

    if (!productId || availableQuantityGrams === undefined) {
      return res.status(400).json({
        success: false,
        error: 'productId and availableQuantityGrams are required',
      });
    }

    if (isNaN(availableQuantityGrams) || availableQuantityGrams < 0) {
      return res.status(400).json({
        success: false,
        error: 'availableQuantityGrams must be a non-negative number',
      });
    }

    const inventory = await upsertInventory({
      productId,
      availableQuantityGrams: parseInt(availableQuantityGrams),
    });

    res.json({
      success: true,
      message: 'Inventory updated successfully',
      inventory: {
        inventoryId: inventory.inventory_id,
        productId: inventory.product_id,
        availableQuantityGrams: parseInt(inventory.available_quantity_grams) || 0,
        createdAt: inventory.created_at,
        updatedAt: inventory.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/inventory/:inventoryId
 * Update inventory quantity
 */
router.put('/:inventoryId', async (req, res, next) => {
  try {
    const inventoryId = parseInt(req.params.inventoryId);
    const { availableQuantityGrams } = req.body;

    if (isNaN(inventoryId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid inventory ID',
      });
    }

    if (availableQuantityGrams === undefined || isNaN(availableQuantityGrams) || availableQuantityGrams < 0) {
      return res.status(400).json({
        success: false,
        error: 'availableQuantityGrams must be a non-negative number',
      });
    }

    // Get existing inventory to get productId
    const existingInventory = await getInventoryById(inventoryId);
    if (!existingInventory) {
      return res.status(404).json({
        success: false,
        error: 'Inventory not found',
      });
    }

    const inventory = await upsertInventory({
      productId: existingInventory.product_id,
      availableQuantityGrams: parseInt(availableQuantityGrams),
    });

    res.json({
      success: true,
      message: 'Inventory updated successfully',
      inventory: {
        inventoryId: inventory.inventory_id,
        productId: inventory.product_id,
        availableQuantityGrams: parseInt(inventory.available_quantity_grams) || 0,
        createdAt: inventory.created_at,
        updatedAt: inventory.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/inventory/add
 * Add quantity to existing inventory (product-level only)
 */
router.post('/add', async (req, res, next) => {
  try {
    const { productId, quantityToAdd } = req.body;

    if (!productId || quantityToAdd === undefined) {
      return res.status(400).json({
        success: false,
        error: 'productId and quantityToAdd are required',
      });
    }

    if (isNaN(quantityToAdd) || quantityToAdd <= 0) {
      return res.status(400).json({
        success: false,
        error: 'quantityToAdd must be a positive number',
      });
    }

    const updated = await updateInventoryQuantity(
      productId,
      parseInt(quantityToAdd)
    );

    if (!updated) {
      // No inventory record exists, create one
      const inventory = await upsertInventory({
        productId,
        availableQuantityGrams: parseInt(quantityToAdd),
      });

      return res.json({
        success: true,
        message: 'Inventory created and updated successfully',
        inventory: {
          inventoryId: inventory.inventory_id,
          productId: inventory.product_id,
          availableQuantityGrams: parseInt(inventory.available_quantity_grams) || 0,
          createdAt: inventory.created_at,
          updatedAt: inventory.updated_at,
        },
      });
    }

    res.json({
      success: true,
      message: 'Inventory updated successfully',
      inventory: {
        inventoryId: updated.inventory_id,
        productId: updated.product_id,
        availableQuantityGrams: parseInt(updated.available_quantity_grams) || 0,
        createdAt: updated.created_at,
        updatedAt: updated.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/inventory/:inventoryId
 * Delete inventory record
 */
router.delete('/:inventoryId', async (req, res, next) => {
  try {
    const inventoryId = parseInt(req.params.inventoryId);

    if (isNaN(inventoryId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid inventory ID',
      });
    }

    const deleted = await deleteInventory(inventoryId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Inventory not found',
      });
    }

    res.json({
      success: true,
      message: 'Inventory deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
