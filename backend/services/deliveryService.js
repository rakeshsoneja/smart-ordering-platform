const { getActiveDeliveryConfig } = require('../models/deliveryConfigModel');
const { getVariantById } = require('../models/variantModel');

/**
 * Delivery Service - Handles delivery charge calculations
 */

/**
 * Calculate total weight in grams for cart items
 * @param {Array} cartItems - Array of cart items with variantId, quantity, and variantWeightGrams
 * @returns {Promise<number>} Total weight in grams
 */
const calculateTotalWeight = async (cartItems) => {
  let totalWeightGrams = 0;

  for (const item of cartItems) {
    let itemWeightGrams = 0;

    // If variantId is provided, get weight from variant
    if (item.variantId) {
      try {
        const variant = await getVariantById(item.variantId);
        if (variant && variant.variant_weight_grams) {
          itemWeightGrams = variant.variant_weight_grams;
        }
      } catch (error) {
        console.error(`Error fetching variant ${item.variantId}:`, error);
        // Continue with weight 0 if variant not found
      }
    } else if (item.variantWeightGrams) {
      // If weight is already in cart item (from frontend)
      itemWeightGrams = item.variantWeightGrams;
    }
    // If no variant weight, itemWeightGrams remains 0

    const quantity = Number(item.quantity) || 0;
    totalWeightGrams += itemWeightGrams * quantity;
  }

  return totalWeightGrams;
};

/**
 * Calculate delivery charge based on total weight and active delivery config
 * @param {number} totalWeightGrams - Total weight in grams
 * @returns {Promise<{deliveryCharge: number, config: object|null}>} Delivery charge and config used
 */
const calculateDeliveryCharge = async (totalWeightGrams) => {
  // Get active delivery config
  const config = await getActiveDeliveryConfig();

  // If no active config, return 0 delivery charge
  if (!config) {
    return {
      deliveryCharge: 0,
      config: null,
    };
  }

  const weightUnitGrams = config.weight_unit_grams;
  const chargeAmount = parseFloat(config.charge_amount);

  // Calculate delivery charge proportionally
  // (total weight / weight unit) × charge amount
  const units = totalWeightGrams / weightUnitGrams;
  const deliveryCharge = units * chargeAmount;

  return {
    deliveryCharge: Math.round(deliveryCharge * 100) / 100, // Round to 2 decimal places
    config: {
      configId: config.config_id,
      weightUnitGrams: config.weight_unit_grams,
      chargeAmount: config.charge_amount,
    },
  };
};

/**
 * Calculate delivery charge for cart items
 * @param {Array} cartItems - Array of cart items
 * @returns {Promise<{totalWeightGrams: number, deliveryCharge: number, config: object|null}>}
 */
const calculateDeliveryForCart = async (cartItems) => {
  // Calculate total weight
  const totalWeightGrams = await calculateTotalWeight(cartItems);

  // Calculate delivery charge
  const { deliveryCharge, config } = await calculateDeliveryCharge(totalWeightGrams);

  return {
    totalWeightGrams,
    deliveryCharge,
    config,
  };
};

module.exports = {
  calculateTotalWeight,
  calculateDeliveryCharge,
  calculateDeliveryForCart,
};

