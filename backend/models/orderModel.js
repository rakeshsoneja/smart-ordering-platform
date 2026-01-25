const { query } = require('../database/dbConnection');

/**
 * Order Model - Handles all database operations for orders
 */

// Get all orders with optional filtering
const getAllOrders = async (filters = {}) => {
  let selectQuery = 'SELECT * FROM orders WHERE 1=1';
  const values = [];
  let paramIndex = 1;

  // Filter by status if provided
  if (filters.status) {
    selectQuery += ` AND status = $${paramIndex}`;
    values.push(filters.status);
    paramIndex++;
  }

  // Order by created_at DESC (newest first)
  selectQuery += ' ORDER BY created_at DESC';

  // Add limit if provided
  if (filters.limit) {
    selectQuery += ` LIMIT $${paramIndex}`;
    values.push(parseInt(filters.limit));
    paramIndex++;
  }

  // Add offset if provided
  if (filters.offset) {
    selectQuery += ` OFFSET $${paramIndex}`;
    values.push(parseInt(filters.offset));
  }

  const result = await query(selectQuery, values);
  return result.rows;
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

// Get orders by customer phone
const getOrdersByCustomerPhone = async (phone) => {
  const selectQuery = 'SELECT * FROM orders WHERE customer_phone = $1 ORDER BY created_at DESC';
  const result = await query(selectQuery, [phone]);
  return result.rows;
};

// Create a new order
const createOrder = async (orderData) => {
  const {
    customerName,
    customerPhone,
    deliveryAddress,
    cartItems,
    amount,
    paymentMode,
    razorpayOrderId,
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
      status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;

  const values = [
    customerName,
    customerPhone,
    deliveryAddress,
    JSON.stringify(cartItems),
    amount,
    paymentMode,
    razorpayOrderId || null,
    status,
  ];

  const result = await query(insertQuery, values);
  return result.rows[0];
};

// Update order status
const updateOrderStatus = async (orderId, status, additionalData = {}) => {
  const updateFields = ['status = $1'];
  const values = [status];
  let paramIndex = 2;

  // Add razorpay payment details if provided
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

  values.push(orderId);
  const updateQuery = `
    UPDATE orders 
    SET ${updateFields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;

  const result = await query(updateQuery, values);
  return result.rows[0];
};

module.exports = {
  getAllOrders,
  getOrderById,
  getOrderByRazorpayOrderId,
  getOrdersByCustomerPhone,
  createOrder,
  updateOrderStatus,
};
