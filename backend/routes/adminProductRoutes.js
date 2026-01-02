const express = require('express');
const router = express.Router();
const {
  createProduct,
  updateProduct,
  getProductById,
} = require('../models/productModel');
const { uploadSingleImage, handleUploadError } = require('../middleware/uploadMiddleware');
const { uploadImage, deleteImage, extractPublicId } = require('../services/cloudinaryService');

/**
 * Admin Product Routes
 * Handles product creation and updates with image uploads
 * Uses multipart/form-data for file uploads
 */

/**
 * POST /api/admin/products
 * Create a new product with image upload
 */
router.post('/', uploadSingleImage, handleUploadError, async (req, res, next) => {
  try {
    const {
      name,
      description,
      price,
      unit,
      unitValue,
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

    let imageUrl = null;

    // Upload image to Cloudinary if provided
    if (req.file) {
      try {
        const uploadResult = await uploadImage(req.file.buffer, 'products');
        imageUrl = uploadResult.url;
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(500).json({
          success: false,
          error: 'Failed to upload image. Please try again.',
        });
      }
    }

    const productData = {
      name: name.trim(),
      description: description ? description.trim() : null,
      price: parseFloat(price),
      unit,
      unitValue: unitValue ? parseInt(unitValue) : 1,
      image: imageUrl, // Store Cloudinary URL
      category: category.trim(),
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
 * PUT /api/admin/products/:id
 * Update a product with optional image upload
 */
router.put('/:id', uploadSingleImage, handleUploadError, async (req, res, next) => {
  try {
    const productId = parseInt(req.params.id);

    if (isNaN(productId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID',
      });
    }

    // Check if product exists
    const existingProduct = await getProductById(productId);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }

    const {
      name,
      description,
      price,
      unit,
      unitValue,
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
    if (name !== undefined) productData.name = name.trim();
    if (description !== undefined) productData.description = description ? description.trim() : null;
    if (price !== undefined) productData.price = parseFloat(price);
    if (unit !== undefined) productData.unit = unit;
    if (unitValue !== undefined) productData.unitValue = parseInt(unitValue);
    if (category !== undefined) productData.category = category.trim();
    if (status !== undefined) productData.status = status;

    // Handle image upload if new image is provided
    if (req.file) {
      try {
        // Upload new image to Cloudinary
        const uploadResult = await uploadImage(req.file.buffer, 'products');
        const newImageUrl = uploadResult.url;

        // Delete old image from Cloudinary if it exists
        if (existingProduct.image) {
          const oldPublicId = extractPublicId(existingProduct.image);
          if (oldPublicId) {
            try {
              await deleteImage(oldPublicId);
            } catch (deleteError) {
              // Log but don't fail the update if deletion fails
              console.warn('Failed to delete old image from Cloudinary:', deleteError);
            }
          }
        }

        productData.image = newImageUrl;
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(500).json({
          success: false,
          error: 'Failed to upload image. Please try again.',
        });
      }
    }

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

module.exports = router;

