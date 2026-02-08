const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../models/productModel');
const {
  getVariantsByProductId,
  getDefaultVariantByProductId,
} = require('../models/variantModel');
const { getInventoryStatus } = require('../models/inventoryModel');

/**
 * Product Routes
 * Handles product CRUD operations
 */

/**
 * GET /api/products
 * Get all products (with optional filters)
 */
router.get('/', async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status, // 'active' or 'disabled'
      category: req.query.category,
    };

    const products = await getAllProducts(filters);

    // Fetch variants for each product
    const productsWithVariants = await Promise.all(
      products.map(async (product) => {
        const variants = await getVariantsByProductId(product.id);
        
        // If variants exist, include them; otherwise use legacy price/unit
        const productData = {
          id: product.id,
          name: product.name,
          description: product.description,
          image: product.image,
          category: product.category,
          status: product.status,
          createdAt: product.created_at,
          updatedAt: product.updated_at,
        };

        // Get product-level inventory (shared across all variants)
        const inventoryStatus = await getInventoryStatus(product.id);
        
        if (variants.length > 0) {
          // Product has variants
          productData.variants = variants.map(v => ({
            variantId: v.variant_id,
            variantName: v.variant_name,
            variantWeightGrams: v.variant_weight_grams,
            variantPrice: parseFloat(v.variant_price),
            isDefaultVariant: v.is_default_variant,
            isActive: v.is_active,
          }));
          // For backward compatibility, set price to default variant price
          const defaultVariant = variants.find(v => v.is_default_variant) || variants[0];
          productData.price = parseFloat(defaultVariant.variant_price);
          productData.unit = product.unit; // Keep for backward compatibility
          productData.unitValue = product.unit_value; // Keep for backward compatibility
        } else {
          // Legacy product without variants
          productData.price = parseFloat(product.price);
          productData.unit = product.unit;
          productData.unitValue = product.unit_value;
        }
        
        // Add product-level inventory info
        if (inventoryStatus) {
          productData.availableQuantityGrams = inventoryStatus.availableQuantityGrams;
          productData.isOutOfStock = inventoryStatus.isOutOfStock;
        } else {
          productData.availableQuantityGrams = null;
          productData.isOutOfStock = false;
        }

        return productData;
      })
    );

    res.json({
      success: true,
      products: productsWithVariants,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/products/:productId
 * Get product by ID
 */
router.get('/:productId', async (req, res, next) => {
  try {
    const productId = parseInt(req.params.productId);

    if (isNaN(productId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID',
      });
    }

    const product = await getProductById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }

    // Fetch variants for this product
    const variants = await getVariantsByProductId(productId);

    const productData = {
      id: product.id,
      name: product.name,
      description: product.description,
      image: product.image,
      category: product.category,
      status: product.status,
      createdAt: product.created_at,
      updatedAt: product.updated_at,
    };

    // Get product-level inventory (shared across all variants)
    const inventoryStatus = await getInventoryStatus(productId);
    
    if (variants.length > 0) {
      // Product has variants
      productData.variants = variants.map(v => ({
        variantId: v.variant_id,
        variantName: v.variant_name,
        variantWeightGrams: v.variant_weight_grams,
        variantPrice: parseFloat(v.variant_price),
        isDefaultVariant: v.is_default_variant,
        isActive: v.is_active,
      }));
      // For backward compatibility, set price to default variant price
      const defaultVariant = variants.find(v => v.is_default_variant) || variants[0];
      productData.price = parseFloat(defaultVariant.variant_price);
      productData.unit = product.unit; // Keep for backward compatibility
      productData.unitValue = product.unit_value; // Keep for backward compatibility
    } else {
      // Legacy product without variants
      productData.price = parseFloat(product.price);
      productData.unit = product.unit;
      productData.unitValue = product.unit_value;
    }
    
    // Add product-level inventory info
    if (inventoryStatus) {
      productData.availableQuantityGrams = inventoryStatus.availableQuantityGrams;
      productData.isOutOfStock = inventoryStatus.isOutOfStock;
    } else {
      productData.availableQuantityGrams = null;
      productData.isOutOfStock = false;
    }

    res.json({
      success: true,
      product: productData,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/products
 * Create a new product
 */
router.post('/', async (req, res, next) => {
  try {
    const {
      name,
      description,
      price,
      unit,
      unitValue,
      image,
      category,
      status,
    } = req.body;

    // Basic validation
    if (!name || !price || !unit || !category) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, price, unit, category',
      });
    }

    if (unit !== 'pc' && unit !== 'gms') {
      return res.status(400).json({
        success: false,
        error: 'Unit must be either "pc" or "gms"',
      });
    }

    if (isNaN(price) || price <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Price must be a positive number',
      });
    }

    const productData = {
      name,
      description,
      price: parseFloat(price),
      unit,
      unitValue: unitValue || 1,
      image,
      category,
      status: status || 'active',
    };

    const product = await createProduct(productData);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        price: parseFloat(product.price),
        unit: product.unit,
        unitValue: product.unit_value,
        image: product.image,
        category: product.category,
        status: product.status,
        createdAt: product.created_at,
        updatedAt: product.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/products/:productId
 * Update a product
 */
router.put('/:productId', async (req, res, next) => {
  try {
    const productId = parseInt(req.params.productId);

    if (isNaN(productId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID',
      });
    }

    const {
      name,
      description,
      price,
      unit,
      unitValue,
      image,
      category,
      status,
    } = req.body;

    // Validate unit if provided
    if (unit && unit !== 'pc' && unit !== 'gms') {
      return res.status(400).json({
        success: false,
        error: 'Unit must be either "pc" or "gms"',
      });
    }

    // Validate price if provided
    if (price !== undefined && (isNaN(price) || price <= 0)) {
      return res.status(400).json({
        success: false,
        error: 'Price must be a positive number',
      });
    }

    // Validate status if provided
    if (status && status !== 'active' && status !== 'disabled') {
      return res.status(400).json({
        success: false,
        error: 'Status must be either "active" or "disabled"',
      });
    }

    const productData = {};
    if (name !== undefined) productData.name = name;
    if (description !== undefined) productData.description = description;
    if (price !== undefined) productData.price = parseFloat(price);
    if (unit !== undefined) productData.unit = unit;
    if (unitValue !== undefined) productData.unitValue = parseInt(unitValue);
    if (image !== undefined) productData.image = image;
    if (category !== undefined) productData.category = category;
    if (status !== undefined) productData.status = status;

    const product = await updateProduct(productId, productData);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }

    res.json({
      success: true,
      message: 'Product updated successfully',
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        price: parseFloat(product.price),
        unit: product.unit,
        unitValue: product.unit_value,
        image: product.image,
        category: product.category,
        status: product.status,
        createdAt: product.created_at,
        updatedAt: product.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/products/:productId
 * Delete/disable a product
 */
router.delete('/:productId', async (req, res, next) => {
  try {
    const productId = parseInt(req.params.productId);

    if (isNaN(productId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID',
      });
    }

    const product = await deleteProduct(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }

    res.json({
      success: true,
      message: 'Product disabled successfully',
      product: {
        id: product.id,
        name: product.name,
        status: product.status,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

