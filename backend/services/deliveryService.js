const { getActiveDeliveryConfig } = require('../models/deliveryConfigModel');
const { getVariantById } = require('../models/variantModel');
const { getProductById } = require('../models/productModel');

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
    let itemWeightGrams = 0
    let variantRow = null

    const variantIdNum =
      item.variantId != null && item.variantId !== ''
        ? Number(item.variantId)
        : NaN
    const hasVariantId = !Number.isNaN(variantIdNum)

    // Prefer DB weight when variantId resolves (authoritative)
    if (hasVariantId) {
      try {
        variantRow = await getVariantById(variantIdNum)
        if (variantRow != null && variantRow.variant_weight_grams != null) {
          const w = Number(variantRow.variant_weight_grams)
          if (!Number.isNaN(w)) itemWeightGrams = w
        }
      } catch (error) {
        console.error(`Error fetching variant ${item.variantId}:`, error)
      }
    }

    // Cart may carry correct grams while variantId is stale/missing after admin edits
    if (itemWeightGrams === 0 && item.variantWeightGrams != null && item.variantWeightGrams !== '') {
      const w = Number(item.variantWeightGrams)
      if (!Number.isNaN(w)) itemWeightGrams = w
    }

    // Variant rows exist: never use legacy product/cart gms — products.unit_value is often the
    // pre-variant pack (e.g. 500g) while the chosen variant is 250g, which doubled billing intermittently.
    const skipLegacyProductGrams = variantRow != null

    if (
      !skipLegacyProductGrams &&
      itemWeightGrams === 0 &&
      item.unit === 'gms' &&
      item.unitValue != null &&
      item.unitValue !== ''
    ) {
      const w = Number(item.unitValue)
      if (!Number.isNaN(w)) itemWeightGrams = w
    }

    // Products row: legacy gms only when this line is not tied to a real variant row (stale id / no variants)
    if (!skipLegacyProductGrams && itemWeightGrams === 0) {
      const productIdRaw = variantRow?.product_id ?? item.productId ?? item.id
      const productId =
        productIdRaw != null && productIdRaw !== '' ? Number(productIdRaw) : NaN
      if (!Number.isNaN(productId)) {
        try {
          const product = await getProductById(productId)
          if (product != null && product.unit === 'gms' && product.unit_value != null) {
            const w = Number(product.unit_value)
            if (!Number.isNaN(w)) itemWeightGrams = w
          }
        } catch (error) {
          console.error(`Error fetching product ${productId} for delivery weight:`, error)
        }
      }
    }

    const quantity = Number(item.quantity) || 0
    totalWeightGrams += itemWeightGrams * quantity
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

  const weightUnitGrams = Number(
    config.weight_unit_grams ?? config.weightUnitGrams
  )
  const chargeAmount = parseFloat(
    String(config.charge_amount ?? config.chargeAmount ?? '0')
  )

  if (
    !weightUnitGrams ||
    weightUnitGrams <= 0 ||
    Number.isNaN(weightUnitGrams) ||
    Number.isNaN(chargeAmount)
  ) {
    return { deliveryCharge: 0, config: null }
  }

  // Calculate delivery charge proportionally
  // (total weight / weight unit) × charge amount
  const units = totalWeightGrams / weightUnitGrams
  const deliveryCharge = units * chargeAmount

  if (Number.isNaN(deliveryCharge) || !Number.isFinite(deliveryCharge)) {
    return { deliveryCharge: 0, config: null }
  }

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

