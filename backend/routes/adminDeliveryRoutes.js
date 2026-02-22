const express = require('express');
const router = express.Router();
const {
  getAllDeliveryConfigs,
  getDeliveryConfigById,
  createDeliveryConfig,
  updateDeliveryConfig,
  deleteDeliveryConfig,
  getActiveDeliveryConfig,
} = require('../models/deliveryConfigModel');

/**
 * Admin Delivery Configuration Routes
 * Handles delivery configuration management
 */

/**
 * GET /api/admin/delivery-config
 * Get all delivery configurations
 */
router.get('/', async (req, res, next) => {
  try {
    const configs = await getAllDeliveryConfigs();
    res.json({
      success: true,
      configs: configs.map(config => ({
        configId: config.config_id,
        weightUnitGrams: config.weight_unit_grams,
        chargeAmount: parseFloat(config.charge_amount),
        isActive: config.is_active,
        createdAt: config.created_at,
        updatedAt: config.updated_at,
      })),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/delivery-config/active
 * Get active delivery configuration
 */
router.get('/active', async (req, res, next) => {
  try {
    const config = await getActiveDeliveryConfig();
    if (!config) {
      return res.json({
        success: true,
        config: null,
        message: 'No active delivery configuration found',
      });
    }
    res.json({
      success: true,
      config: {
        configId: config.config_id,
        weightUnitGrams: config.weight_unit_grams,
        chargeAmount: parseFloat(config.charge_amount),
        isActive: config.is_active,
        createdAt: config.created_at,
        updatedAt: config.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/delivery-config/:id
 * Get delivery configuration by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const configId = parseInt(req.params.id);
    if (isNaN(configId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid config ID',
      });
    }

    const config = await getDeliveryConfigById(configId);
    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Delivery configuration not found',
      });
    }

    res.json({
      success: true,
      config: {
        configId: config.config_id,
        weightUnitGrams: config.weight_unit_grams,
        chargeAmount: parseFloat(config.charge_amount),
        isActive: config.is_active,
        createdAt: config.created_at,
        updatedAt: config.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/delivery-config
 * Create a new delivery configuration
 */
router.post('/', async (req, res, next) => {
  try {
    const { weightUnitGrams, chargeAmount, isActive } = req.body;

    // Validation
    if (!weightUnitGrams || weightUnitGrams <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Weight unit in grams must be a positive number',
      });
    }

    if (chargeAmount === undefined || chargeAmount < 0) {
      return res.status(400).json({
        success: false,
        error: 'Charge amount must be a non-negative number',
      });
    }

    const configData = {
      weightUnitGrams: parseInt(weightUnitGrams),
      chargeAmount: parseFloat(chargeAmount),
      isActive: isActive === true || isActive === 'true',
    };

    const config = await createDeliveryConfig(configData);

    res.status(201).json({
      success: true,
      message: 'Delivery configuration created successfully',
      config: {
        configId: config.config_id,
        weightUnitGrams: config.weight_unit_grams,
        chargeAmount: parseFloat(config.charge_amount),
        isActive: config.is_active,
        createdAt: config.created_at,
        updatedAt: config.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/admin/delivery-config/:id
 * Update delivery configuration
 */
router.put('/:id', async (req, res, next) => {
  try {
    const configId = parseInt(req.params.id);
    if (isNaN(configId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid config ID',
      });
    }

    const { weightUnitGrams, chargeAmount, isActive } = req.body;

    // Check if config exists
    const existingConfig = await getDeliveryConfigById(configId);
    if (!existingConfig) {
      return res.status(404).json({
        success: false,
        error: 'Delivery configuration not found',
      });
    }

    const configData = {};
    if (weightUnitGrams !== undefined) {
      if (weightUnitGrams <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Weight unit in grams must be a positive number',
        });
      }
      configData.weightUnitGrams = parseInt(weightUnitGrams);
    }

    if (chargeAmount !== undefined) {
      if (chargeAmount < 0) {
        return res.status(400).json({
          success: false,
          error: 'Charge amount must be a non-negative number',
        });
      }
      configData.chargeAmount = parseFloat(chargeAmount);
    }

    if (isActive !== undefined) {
      configData.isActive = isActive === true || isActive === 'true';
    }

    const config = await updateDeliveryConfig(configId, configData);

    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Delivery configuration not found',
      });
    }

    res.json({
      success: true,
      message: 'Delivery configuration updated successfully',
      config: {
        configId: config.config_id,
        weightUnitGrams: config.weight_unit_grams,
        chargeAmount: parseFloat(config.charge_amount),
        isActive: config.is_active,
        createdAt: config.created_at,
        updatedAt: config.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/admin/delivery-config/:id
 * Delete delivery configuration
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const configId = parseInt(req.params.id);
    if (isNaN(configId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid config ID',
      });
    }

    const config = await deleteDeliveryConfig(configId);
    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Delivery configuration not found',
      });
    }

    res.json({
      success: true,
      message: 'Delivery configuration deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

