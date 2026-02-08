const express = require('express');
const router = express.Router();
const { validateRequest, orderValidationRules, paymentVerificationRules } = require('../middleware/validateRequest');
const { createOrder, getOrderById, getOrderByRazorpayOrderId, updateOrderStatus, getOrdersByCustomerPhone } = require('../models/orderModel');
const { createRazorpayOrder, verifyPaymentSignature } = require('../services/razorpayService');
const { sendOrderConfirmationSMS, sendPaymentSuccessSMS } = require('../services/smsService');
const { deductInventoryForOrder } = require('../models/inventoryModel');

/**
 * Order Routes
 * Handles order creation, payment processing, and order status
 */

/**
 * POST /api/orders
 * Create a new order
 * For COD orders, order is created directly
 * For Razorpay orders, a Razorpay order is created first
 */
router.post('/', validateRequest(orderValidationRules), async (req, res, next) => {
  try {
    const {
      customerName,
      customerPhone,
      deliveryAddress,
      cartItems,
      amount,
      paymentMode,
    } = req.body;

    let razorpayOrderId = null;
    let orderStatus = 'pending';

    // If payment mode is Razorpay, create Razorpay order first
    if (paymentMode === 'razorpay') {
      try {
        const razorpayOrder = await createRazorpayOrder(amount, 'INR', {
          customer_name: customerName,
          customer_phone: customerPhone,
        });
        razorpayOrderId = razorpayOrder.id;
        orderStatus = 'payment_pending';
      } catch (error) {
        console.error('Error creating Razorpay order:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to initialize payment. Please try again.',
        });
      }
    } else if (paymentMode === 'cod') {
      // For COD, order is confirmed immediately
      orderStatus = 'confirmed';
    }

    // For COD orders, deduct inventory atomically before creating order
    if (paymentMode === 'cod') {
      const inventoryDeduction = await deductInventoryForOrder(cartItems);
      
      if (!inventoryDeduction.success) {
        // Get product name from failed items for user-friendly error message
        const failedItem = inventoryDeduction.failedItems && inventoryDeduction.failedItems.length > 0
          ? inventoryDeduction.failedItems[0]
          : null;
        const productName = failedItem && failedItem.productName
          ? failedItem.productName
          : 'item';
        
        return res.status(400).json({
          success: false,
          error: `Sorry, ${productName} went out of stock while placing your order`,
          failedItems: inventoryDeduction.failedItems,
        });
      }
    }

    // Create order in database
    const orderData = {
      customerName,
      customerPhone,
      deliveryAddress,
      cartItems,
      amount,
      paymentMode,
      razorpayOrderId,
      status: orderStatus,
    };

    const order = await createOrder(orderData);

    // Send SMS for COD orders immediately
    if (paymentMode === 'cod') {
      const estimatedDelivery = '30-45 minutes';
      await sendOrderConfirmationSMS(customerPhone, {
        orderId: order.id,
        amount: amount,
        estimatedDelivery: estimatedDelivery,
      });
    }

    res.status(201).json({
      success: true,
      message: paymentMode === 'cod' 
        ? 'Order placed successfully' 
        : 'Order created. Please complete payment.',
      order: {
        id: order.id,
        customerName: order.customer_name,
        customerPhone: order.customer_phone,
        amount: order.amount,
        paymentMode: order.payment_mode,
        status: order.status,
        razorpayOrderId: order.razorpay_order_id,
        createdAt: order.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/orders/verify-payment
 * Verify Razorpay payment and update order status
 */
router.post('/verify-payment', validateRequest(paymentVerificationRules), async (req, res, next) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    // Find order by Razorpay order ID
    const order = await getOrderByRazorpayOrderId(razorpayOrderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    // Check if order is already paid
    if (order.status === 'paid' || order.status === 'confirmed') {
      return res.status(400).json({
        success: false,
        error: 'Order is already paid',
      });
    }

    // Verify payment signature
    const isSignatureValid = verifyPaymentSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!isSignatureValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment signature',
      });
    }

    // Deduct inventory atomically before confirming payment
    const cartItems = order.cart_items; // JSONB field, already parsed by PostgreSQL
    const inventoryDeduction = await deductInventoryForOrder(cartItems);
    
      if (!inventoryDeduction.success) {
        // Update order status to indicate inventory failure
        await updateOrderStatus(order.id, 'payment_failed', {
          razorpayPaymentId,
          razorpaySignature,
        });
        
        // Get product name from failed items for user-friendly error message
        const failedItem = inventoryDeduction.failedItems && inventoryDeduction.failedItems.length > 0
          ? inventoryDeduction.failedItems[0]
          : null;
        const productName = failedItem && failedItem.productName
          ? failedItem.productName
          : 'item';
        
        return res.status(400).json({
          success: false,
          error: `Sorry, ${productName} went out of stock while placing your order`,
          failedItems: inventoryDeduction.failedItems,
        });
      }

    // Update order status
    const updatedOrder = await updateOrderStatus(order.id, 'paid', {
      razorpayPaymentId,
      razorpaySignature,
    });

    // Send confirmation SMS
    await sendPaymentSuccessSMS(order.customer_phone, {
      orderId: order.id,
      paymentId: razorpayPaymentId,
      amount: order.amount,
    });

    // Also send order confirmation SMS
    const estimatedDelivery = '30-45 minutes';
    await sendOrderConfirmationSMS(order.customer_phone, {
      orderId: order.id,
      amount: order.amount,
      estimatedDelivery: estimatedDelivery,
    });

    res.json({
      success: true,
      message: 'Payment verified successfully',
      order: {
        id: updatedOrder.id,
        status: updatedOrder.status,
        razorpayPaymentId: updatedOrder.razorpay_payment_id,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/orders/search
 * Search orders by phone number
 */
router.get('/search', async (req, res, next) => {
  try {
    const { phone } = req.query;

    if (!phone || phone.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required',
      });
    }

    const orders = await getOrdersByCustomerPhone(phone.trim());

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
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/orders/:orderId
 * Get order details by ID
 */
router.get('/:orderId', async (req, res, next) => {
  try {
    const orderId = parseInt(req.params.orderId);

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

module.exports = router;


