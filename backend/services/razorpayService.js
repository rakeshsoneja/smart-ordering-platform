const Razorpay = require('razorpay');
const crypto = require('crypto');
require('dotenv').config();

/**
 * Razorpay Service - Handles all Razorpay payment operations
 */

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Create a Razorpay order
 * @param {number} amount - Order amount in paise (e.g., 10000 for ₹100)
 * @param {string} currency - Currency code (default: INR)
 * @param {object} notes - Additional notes/metadata
 * @returns {Promise<object>} Razorpay order object
 */
const createRazorpayOrder = async (amount, currency = 'INR', notes = {}) => {
  try {
    const options = {
      amount: amount * 100, // Convert to paise (Razorpay expects amount in smallest currency unit)
      currency: currency,
      receipt: `receipt_${Date.now()}`,
      notes: notes,
    };

    const order = await razorpay.orders.create(options);
    console.log('Razorpay order created:', order.id);
    return order;
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw new Error(`Failed to create Razorpay order: ${error.message}`);
  }
};

/**
 * Verify Razorpay payment signature
 * @param {string} razorpayOrderId - Razorpay order ID
 * @param {string} razorpayPaymentId - Razorpay payment ID
 * @param {string} razorpaySignature - Razorpay signature
 * @returns {boolean} True if signature is valid
 */
const verifyPaymentSignature = (razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
  try {
    const text = `${razorpayOrderId}|${razorpayPaymentId}`;
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    const isValid = generatedSignature === razorpaySignature;
    
    if (!isValid) {
      console.error('Payment signature verification failed');
    }
    
    return isValid;
  } catch (error) {
    console.error('Error verifying payment signature:', error);
    return false;
  }
};

/**
 * Verify Razorpay webhook signature
 * @param {string} webhookBody - Raw webhook body (string)
 * @param {string} webhookSignature - Webhook signature from headers
 * @returns {boolean} True if signature is valid
 */
const verifyWebhookSignature = (webhookBody, webhookSignature) => {
  try {
    const secret = process.env.WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(webhookBody)
      .digest('hex');

    const isValid = generatedSignature === webhookSignature;
    
    if (!isValid) {
      console.error('Webhook signature verification failed');
    }
    
    return isValid;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
};

/**
 * Fetch payment details from Razorpay
 * @param {string} paymentId - Razorpay payment ID
 * @returns {Promise<object>} Payment details
 */
const fetchPaymentDetails = async (paymentId) => {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    console.error('Error fetching payment details:', error);
    throw new Error(`Failed to fetch payment details: ${error.message}`);
  }
};

module.exports = {
  createRazorpayOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
  fetchPaymentDetails,
};
















