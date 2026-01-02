const { query } = require('../database/dbConnection');

/**
 * Order Model - Handles all database operations for orders
 */

// Create a new order
const createOrder = async (orderData) => {
  const {
    customerName,
    customerPhone,
    deliveryAddress,
    cartItems,
    amount,
    paymentMode,
    razorpayOrderId = null,
    razorpayPaymentId = null,
    razorpaySignature = null,
    status = 'pending',
  } = orderData;

  const insertQuery = `
    INSERT INTO orders (
      customer_name, 
      customer_phone, 
      delivery_address, 
      cart_items, 
      amount, 
      payment_mode, 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature, 
      status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `;

  const values = [
    customerName,
    customerPhone,
    deliveryAddress,
    JSON.stringify(cartItems),
    amount,
    paymentMode,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    status,
  ];

  const result = await query(insertQuery, values);
  return result.rows[0];
};

// Get order by ID
const getOrderById = async (orderId) => {
  const selectQuery = 'SELECT * FROM orders WHERE id = $1';
  const result = await query(selectQuery, [orderId]);
  return result.rows[0];
};

// Get order by Razorpay order ID
const getOrderByRazorpayOrderId = async (razorpayOrderId) => {
  const selectQuery = 'SELECT * FROM orders WHERE razorpay_order_id = $1';
  const result = await query(selectQuery, [razorpayOrderId]);
  return result.rows[0];
};

// Update order status
const updateOrderStatus = async (orderId, status, additionalData = {}) => {
  const updateFields = ['status = $2'];
  const values = [orderId, status];
  let paramIndex = 3;

  // Dynamically add additional fields to update
  if (additionalData.razorpayPaymentId) {
    updateFields.push(`razorpay_payment_id = $${paramIndex}`);
    values.push(additionalData.razorpayPaymentId);
    paramIndex++;
  }

  if (additionalData.razorpaySignature) {
    updateFields.push(`razorpay_signature = $${paramIndex}`);
    values.push(additionalData.razorpaySignature);
    paramIndex++;
  }

  const updateQuery = `
    UPDATE orders 
    SET ${updateFields.join(', ')}
    WHERE id = $1
    RETURNING *
  `;

  const result = await query(updateQuery, values);
  return result.rows[0];
};

// Get orders by customer phone
const getOrdersByCustomerPhone = async (customerPhone) => {
  const selectQuery = `
    SELECT * FROM orders 
    WHERE customer_phone = $1 
    ORDER BY created_at DESC
  `;
  const result = await query(selectQuery, [customerPhone]);
  return result.rows;
};

module.exports = {
  createOrder,
  getOrderById,
  getOrderByRazorpayOrderId,
  updateOrderStatus,
  getOrdersByCustomerPhone,
};








