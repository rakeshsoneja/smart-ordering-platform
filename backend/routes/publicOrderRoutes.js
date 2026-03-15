/**
 * Public order route - secure order details by JWT token (e.g. from WhatsApp "Order Details" button).
 * No login required. Token is short-lived and does not expose order_id in URL.
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { getOrderById } = require('../models/orderModel');

/**
 * GET /api/public/order/:token
 * Verify JWT, fetch order by decoded orderId, return order details for receipt display.
 * 401 if token invalid/expired, 404 if order not found.
 */
router.get('/order/:token', async (req, res, next) => {
  try {
    const { token } = req.params;
    const secret = process.env.ORDER_LINK_SECRET;

    if (!secret) {
      return res.status(503).json({
        success: false,
        error: 'Order link feature is not configured',
      });
    }

    if (!token || token.trim() === '') {
      return res.status(401).json({
        success: false,
        error: 'Invalid or missing token',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token.trim(), secret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Link has expired',
        });
      }
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired link',
      });
    }

    const orderId = decoded.orderId;
    if (orderId == null) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
    }

    const order = await getOrderById(Number(orderId));
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    const amount = order.amount != null ? parseFloat(order.amount) : 0;
    const deliveryCharge = order.delivery_charge != null ? parseFloat(order.delivery_charge) : 0;
    const itemTotal = amount - deliveryCharge;

    res.json({
      success: true,
      order: {
        id: order.id,
        customerName: order.customer_name,
        customerPhone: order.customer_phone,
        deliveryAddress: order.delivery_address,
        cartItems: order.cart_items,
        amount: isNaN(amount) ? 0 : amount,
        itemTotal: isNaN(itemTotal) ? 0 : itemTotal,
        deliveryCharge: isNaN(deliveryCharge) ? 0 : deliveryCharge,
        totalWeightGrams: order.total_weight_grams,
        paymentMode: order.payment_mode,
        status: order.status,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
