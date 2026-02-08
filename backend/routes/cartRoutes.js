const express = require('express');
const router = express.Router();
const { getInventoryStatus, deductInventoryAtomically } = require('../models/inventoryModel');
const { getVariantById } = require('../models/variantModel');
const { getProductById } = require('../models/productModel');

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
 * Body: { productId, variantId (optional), quantity, currentCartItems (optional) }
 * 
 * Inventory is maintained at PRODUCT LEVEL (shared across all variants)
 * Calculates total requested grams across ALL variants of the same product in cart
 */
router.post('/validate-inventory', async (req, res, next) => {
  try {
    const { productId, variantId, quantity, currentCartItems = [] } = req.body;

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

    // Calculate requested quantity in grams for the NEW/updated item
    // requestedQuantityGrams = variantWeightGrams × quantity
    let newItemRequestedGrams = 0;
    if (variantId && variantWeightGrams) {
      // For variant-based products, multiply quantity by variant weight
      newItemRequestedGrams = quantity * variantWeightGrams;
    } else {
      // Legacy products without variants - quantity is already in base units
      // For backward compatibility, assume quantity is in grams
      newItemRequestedGrams = quantity;
    }

    // Calculate total requested grams across ALL variants of the same product in cart
    // This includes:
    // 1. All existing cart items for this product (from currentCartItems)
    // 2. The new/updated item being added
    let totalRequestedGrams = newItemRequestedGrams;

    // Sum up grams from existing cart items for the same product
    for (const cartItem of currentCartItems) {
      // Skip the item being updated (we'll use the new quantity instead)
      if (cartItem.productId === productId && cartItem.variantId === variantId) {
        continue; // Skip this item, we'll use the new quantity
      }

      // Only process items for the same product
      if (cartItem.productId === productId) {
        let itemGrams = 0;
        
        if (cartItem.variantId) {
          // Get variant weight
          const existingVariant = await getVariantById(cartItem.variantId);
          if (existingVariant && existingVariant.variant_weight_grams) {
            itemGrams = cartItem.quantity * existingVariant.variant_weight_grams;
          }
        } else {
          // Legacy product without variant - assume quantity is in grams
          itemGrams = cartItem.quantity;
        }

        totalRequestedGrams += itemGrams;
      }
    }

    // Get product-level inventory status (shared across all variants)
    const inventoryStatus = await getInventoryStatus(productId);

    if (!inventoryStatus) {
      // No inventory record exists - treat as in stock (backward compatibility)
      return res.json({
        success: true,
        available: true,
        availableQuantityGrams: null,
        requestedQuantityGrams: totalRequestedGrams,
      });
    }

    const { availableQuantityGrams, isOutOfStock } = inventoryStatus;

    if (isOutOfStock || availableQuantityGrams < totalRequestedGrams) {
      // Get product name for user-friendly message
      const product = await getProductById(productId);
      const productName = product ? product.name : 'Product';

      return res.json({
        success: true,
        available: false,
        availableQuantityGrams,
        requestedQuantityGrams: totalRequestedGrams,
        productName,
        message: 'Requested quantity not available in stock',
      });
    }

    return res.json({
      success: true,
      available: true,
      availableQuantityGrams,
      requestedQuantityGrams: totalRequestedGrams,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;












