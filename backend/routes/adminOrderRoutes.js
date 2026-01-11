const express = require('express');
const router = express.Router();
const { getAllOrders, getOrderById, updateOrderStatus } = require('../models/orderModel');

/**
 * Admin Order Routes
 * Handles order viewing and status updates (READ, UPDATE operations)
 * CRUD mapping:
 * - READ: GET /admin/orders (list all), GET /admin/orders/:id (get one)
 * - UPDATE: PATCH /admin/orders/:id/status (update order status only)
 * Note: CREATE and DELETE operations are not exposed to admin
 */

/**
 * GET /api/admin/orders
 * Get all orders (READ operation)
 * Returns orders sorted by newest first (created_at DESC)
 */
router.get('/', async (req, res, next) => {
  try {
    // Only fetch CONFIRMED orders (active orders)
    const orders = await getAllOrders({ status: 'confirmed' });

    res.json({
      success: true,
      orders: orders.map(order => ({
        id: order.id,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        delivery_address: order.delivery_address,
        items: order.cart_items, // Map cart_items to items for frontend
        total_amount: parseFloat(order.amount), // Map amount to total_amount
        payment_status: order.payment_mode, // Map payment_mode to payment_status
        order_status: order.status, // Map status to order_status
        payment_mode: order.payment_mode,
        razorpay_order_id: order.razorpay_order_id,
        razorpay_payment_id: order.razorpay_payment_id,
        created_at: order.created_at,
        updated_at: order.updated_at,
      })),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/orders/:id
 * Get order by ID (READ operation)
 */
router.get('/:id', async (req, res, next) => {
  try {
    const orderId = parseInt(req.params.id);

    if (isNaN(orderId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID',
      });
    }

    const order = await getOrderById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    res.json({
      success: true,
      order: {
        id: order.id,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        delivery_address: order.delivery_address,
        items: order.cart_items, // Map cart_items to items for frontend
        total_amount: parseFloat(order.amount), // Map amount to total_amount
        payment_status: order.payment_mode, // Map payment_mode to payment_status
        order_status: order.status, // Map status to order_status
        payment_mode: order.payment_mode,
        razorpay_order_id: order.razorpay_order_id,
        razorpay_payment_id: order.razorpay_payment_id,
        created_at: order.created_at,
        updated_at: order.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/admin/orders/:id/status
 * Update order status (UPDATE operation)
 * Only allows updating order_status field
 * Valid status transitions should be enforced by business logic
 */
router.patch('/:id/status', async (req, res, next) => {
  try {
    const orderId = parseInt(req.params.id);

    if (isNaN(orderId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID',
      });
    }

    const { order_status } = req.body;

    if (!order_status) {
      return res.status(400).json({
        success: false,
        error: 'order_status is required',
      });
    }

    // Validate status value
    const validStatuses = ['pending', 'payment_pending', 'confirmed', 'paid', 'cancelled', 'completed'];
    if (!validStatuses.includes(order_status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid order status. Valid statuses: ${validStatuses.join(', ')}`,
      });
    }

    // Check if order exists
    const existingOrder = await getOrderById(orderId);
    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    // Update order status
    const updatedOrder = await updateOrderStatus(orderId, order_status);

    res.json({
      success: true,
      message: 'Order status updated successfully',
      order: {
        id: updatedOrder.id,
        customer_name: updatedOrder.customer_name,
        customer_phone: updatedOrder.customer_phone,
        delivery_address: updatedOrder.delivery_address,
        items: updatedOrder.cart_items,
        total_amount: parseFloat(updatedOrder.amount),
        payment_status: updatedOrder.payment_mode,
        order_status: updatedOrder.status,
        payment_mode: updatedOrder.payment_mode,
        created_at: updatedOrder.created_at,
        updated_at: updatedOrder.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

