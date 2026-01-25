const express = require('express');
const router = express.Router();
const { getAllOrders, getOrderById, updateOrderStatus } = require('../models/orderModel');

/**
 * Admin Order Routes
 * Handles order management for admin panel
 */

/**
 * GET /api/admin/orders
 * Get all orders with optional filtering
 */
router.get('/', async (req, res, next) => {
  try {
    const { status, limit, offset } = req.query;
    
    const orders = await getAllOrders({ status, limit, offset });

    res.json({
      success: true,
      orders: orders.map(order => {
        const amount = order.amount != null ? parseFloat(order.amount) : 0
        return {
          id: order.id,
          customerName: order.customer_name,
          customerPhone: order.customer_phone,
          deliveryAddress: order.delivery_address,
          cartItems: order.cart_items,
          amount: isNaN(amount) ? 0 : amount,
          paymentMode: order.payment_mode,
          status: order.status,
          razorpayOrderId: order.razorpay_order_id,
          razorpayPaymentId: order.razorpay_payment_id,
          createdAt: order.created_at,
          updatedAt: order.updated_at,
        }
      }),
      total: orders.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/orders/:id
 * Get order details by ID
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

    const amount = order.amount != null ? parseFloat(order.amount) : 0
    res.json({
      success: true,
      order: {
        id: order.id,
        customerName: order.customer_name,
        customerPhone: order.customer_phone,
        deliveryAddress: order.delivery_address,
        cartItems: order.cart_items,
        amount: isNaN(amount) ? 0 : amount,
        paymentMode: order.payment_mode,
        status: order.status,
        razorpayOrderId: order.razorpay_order_id,
        razorpayPaymentId: order.razorpay_payment_id,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/admin/orders/:id/status
 * Update order status
 */
router.put('/:id/status', async (req, res, next) => {
  try {
    const orderId = parseInt(req.params.id);
    const { status } = req.body;

    if (isNaN(orderId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID',
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required',
      });
    }

    const validStatuses = ['pending', 'confirmed', 'paid', 'payment_pending', 'payment_failed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const updatedOrder = await updateOrderStatus(orderId, status);

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    res.json({
      success: true,
      message: 'Order status updated successfully',
      order: {
        id: updatedOrder.id,
        status: updatedOrder.status,
        updatedAt: updatedOrder.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

