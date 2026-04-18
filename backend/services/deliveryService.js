const { getEffectiveDeliveryConfig } = require('../models/deliveryConfigModel');
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
    let usedVariantRowWeight = false

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
          if (!Number.isNaN(w)) {
            itemWeightGrams = w
            usedVariantRowWeight = true
          }
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

    // Only skip legacy product gms when the variant row actually supplied a weight. If the row
    // exists but variant_weight_grams is null, falling back avoids ₹0 delivery while still
    // preventing the classic mismatch where product.unit_value is a different pack than the variant.
    const skipLegacyProductGrams = usedVariantRowWeight

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
 * @param {string|null} stateCode - Optional state code for state-based config lookup
 * @returns {Promise<{deliveryCharge: number, config: object|null}>} Delivery charge and config used
 */
const calculateDeliveryCharge = async (totalWeightGrams, stateCode = null) => {
  // Get state-specific active config, fallback to active global config
  const config = await getEffectiveDeliveryConfig(stateCode);

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
      stateCode: config.state_code ?? null,
      stateName: config.state_name ?? null,
    },
  };
};

/**
 * Calculate delivery charge for cart items
 * @param {Array} cartItems - Array of cart items
 * @param {string|null} stateCode - Optional state code
 * @returns {Promise<{totalWeightGrams: number, deliveryCharge: number, config: object|null}>}
 */
const calculateDeliveryForCart = async (cartItems, stateCode = null) => {
  // Calculate total weight
  const totalWeightGrams = await calculateTotalWeight(cartItems);

  // Calculate delivery charge
  const { deliveryCharge, config } = await calculateDeliveryCharge(totalWeightGrams, stateCode);

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

