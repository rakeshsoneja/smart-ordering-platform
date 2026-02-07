const express = require('express');
const router = express.Router();
const {
  getVariantsByProductId,
  getVariantById,
  createVariant,
  updateVariant,
  deleteVariant,
} = require('../models/variantModel');
const { getProductById } = require('../models/productModel');

/**
 * Variant Routes
 * Handles variant CRUD operations
 */

/**
 * GET /api/variants/product/:productId
 * Get all variants for a product
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

    // Verify product exists
    const product = await getProductById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }

    const variants = await getVariantsByProductId(productId);

    res.json({
      success: true,
      variants: variants.map(v => ({
        variantId: v.variant_id,
        productId: v.product_id,
        variantName: v.variant_name,
        variantWeightGrams: v.variant_weight_grams,
        variantPrice: parseFloat(v.variant_price),
        isDefaultVariant: v.is_default_variant,
        isActive: v.is_active,
        createdAt: v.created_at,
        updatedAt: v.updated_at,
      })),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/variants/:variantId
 * Get variant by ID
 */
router.get('/:variantId', async (req, res, next) => {
  try {
    const variantId = parseInt(req.params.variantId);

    if (isNaN(variantId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid variant ID',
      });
    }

    const variant = await getVariantById(variantId);

    if (!variant) {
      return res.status(404).json({
        success: false,
        error: 'Variant not found',
      });
    }

    res.json({
      success: true,
      variant: {
        variantId: variant.variant_id,
        productId: variant.product_id,
        variantName: variant.variant_name,
        variantWeightGrams: variant.variant_weight_grams,
        variantPrice: parseFloat(variant.variant_price),
        isDefaultVariant: variant.is_default_variant,
        isActive: variant.is_active,
        createdAt: variant.created_at,
        updatedAt: variant.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/variants
 * Create a new variant
 */
router.post('/', async (req, res, next) => {
  try {
    const {
      productId,
      variantName,
      variantWeightGrams,
      variantPrice,
      isDefaultVariant,
      isActive,
    } = req.body;

    // Validation
    if (!productId || !variantName || variantPrice === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: productId, variantName, variantPrice',
      });
    }

    // Verify product exists
    const product = await getProductById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }

    if (isNaN(variantPrice) || variantPrice <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Variant price must be a positive number',
      });
    }

    const variantData = {
      productId: parseInt(productId),
      variantName: variantName.trim(),
      variantWeightGrams: variantWeightGrams ? parseInt(variantWeightGrams) : null,
      variantPrice: parseFloat(variantPrice),
      isDefaultVariant: isDefaultVariant || false,
      isActive: isActive !== undefined ? isActive : true,
    };

    const variant = await createVariant(variantData);

    res.status(201).json({
      success: true,
      message: 'Variant created successfully',
      variant: {
        variantId: variant.variant_id,
        productId: variant.product_id,
        variantName: variant.variant_name,
        variantWeightGrams: variant.variant_weight_grams,
        variantPrice: parseFloat(variant.variant_price),
        isDefaultVariant: variant.is_default_variant,
        isActive: variant.is_active,
        createdAt: variant.created_at,
        updatedAt: variant.updated_at,
      },
    });
  } catch (error) {
    // Handle unique constraint violation
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        error: 'A variant with this name already exists for this product',
      });
    }
    next(error);
  }
});

/**
 * PUT /api/variants/:variantId
 * Update a variant
 */
router.put('/:variantId', async (req, res, next) => {
  try {
    const variantId = parseInt(req.params.variantId);

    if (isNaN(variantId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid variant ID',
      });
    }

    const variant = await getVariantById(variantId);
    if (!variant) {
      return res.status(404).json({
        success: false,
        error: 'Variant not found',
      });
    }

    const {
      variantName,
      variantWeightGrams,
      variantPrice,
      isDefaultVariant,
      isActive,
    } = req.body;

    // Validate price if provided
    if (variantPrice !== undefined && (isNaN(variantPrice) || variantPrice <= 0)) {
      return res.status(400).json({
        success: false,
        error: 'Variant price must be a positive number',
      });
    }

    const variantData = {};
    if (variantName !== undefined) variantData.variantName = variantName.trim();
    if (variantWeightGrams !== undefined) variantData.variantWeightGrams = variantWeightGrams ? parseInt(variantWeightGrams) : null;
    if (variantPrice !== undefined) variantData.variantPrice = parseFloat(variantPrice);
    if (isDefaultVariant !== undefined) variantData.isDefaultVariant = isDefaultVariant;
    if (isActive !== undefined) variantData.isActive = isActive;

    const updatedVariant = await updateVariant(variantId, variantData);

    res.json({
      success: true,
      message: 'Variant updated successfully',
      variant: {
        variantId: updatedVariant.variant_id,
        productId: updatedVariant.product_id,
        variantName: updatedVariant.variant_name,
        variantWeightGrams: updatedVariant.variant_weight_grams,
        variantPrice: parseFloat(updatedVariant.variant_price),
        isDefaultVariant: updatedVariant.is_default_variant,
        isActive: updatedVariant.is_active,
        createdAt: updatedVariant.created_at,
        updatedAt: updatedVariant.updated_at,
      },
    });
  } catch (error) {
    // Handle unique constraint violation
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        error: 'A variant with this name already exists for this product',
      });
    }
    next(error);
  }
});

/**
 * DELETE /api/variants/:variantId
 * Delete/disable a variant
 */
router.delete('/:variantId', async (req, res, next) => {
  try {
    const variantId = parseInt(req.params.variantId);

    if (isNaN(variantId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid variant ID',
      });
    }

    const variant = await deleteVariant(variantId);

    if (!variant) {
      return res.status(404).json({
        success: false,
        error: 'Variant not found',
      });
    }

    res.json({
      success: true,
      message: 'Variant disabled successfully',
      variant: {
        variantId: variant.variant_id,
        isActive: variant.is_active,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

