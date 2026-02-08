const express = require('express');
const router = express.Router();
const { getInventoryStatus, deductInventoryAtomically } = require('../models/inventoryModel');
const { getVariantById } = require('../models/variantModel');

/**
 * Cart Routes
 * Note: In a production app, you might want to store cart in Redis or database
 * For this example, we'll handle cart operations on the frontend
 * and only send cart data when placing an order
 */

// Get cart (if stored server-side)
router.get('/', (req, res) => {
  // In a real app, you might retrieve cart from session or database
  res.json({
    success: true,
    message: 'Cart operations are handled on the frontend',
    cart: [],
  });
});

/**
 * POST /api/cart/validate-inventory
 * Validate if requested quantity is available in inventory
 * Body: { productId, variantId (optional), quantity }
 */
router.post('/validate-inventory', async (req, res, next) => {
  try {
    const { productId, variantId, quantity } = req.body;

    if (!productId || !quantity) {
      return res.status(400).json({
        success: false,
        error: 'productId and quantity are required',
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Quantity must be greater than 0',
      });
    }

    // Get variant weight if variant exists
    let variantWeightGrams = null;
    if (variantId) {
      const variant = await getVariantById(variantId);
      if (variant) {
        variantWeightGrams = variant.variant_weight_grams;
      }
    }

    // Calculate requested quantity in grams
    // requestedQuantityGrams = variantWeightGrams × quantity
    let requestedQuantityGrams = 0;
    if (variantId && variantWeightGrams) {
      // For variant-based products, multiply quantity by variant weight
      requestedQuantityGrams = quantity * variantWeightGrams;
    } else {
      // Legacy products without variants - quantity is already in base units
      // For backward compatibility, assume quantity is in grams
      requestedQuantityGrams = quantity;
    }

    // Get product-level inventory status (shared across all variants)
    const inventoryStatus = await getInventoryStatus(productId);

    if (!inventoryStatus) {
      // No inventory record exists - treat as in stock (backward compatibility)
      return res.json({
        success: true,
        available: true,
        availableQuantityGrams: null,
        requestedQuantityGrams,
      });
    }

    const { availableQuantityGrams, isOutOfStock } = inventoryStatus;

    if (isOutOfStock || availableQuantityGrams < requestedQuantityGrams) {
      return res.json({
        success: true,
        available: false,
        availableQuantityGrams,
        requestedQuantityGrams,
        message: 'Requested quantity not available in stock',
      });
    }

    return res.json({
      success: true,
      available: true,
      availableQuantityGrams,
      requestedQuantityGrams,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;












