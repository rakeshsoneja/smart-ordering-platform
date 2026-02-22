const express = require('express');
const router = express.Router();
const { validateRequest, orderValidationRules, paymentVerificationRules } = require('../middleware/validateRequest');
const { createOrder, getOrderById, getOrderByRazorpayOrderId, updateOrderStatus, getOrdersByCustomerPhone } = require('../models/orderModel');
const { createRazorpayOrder, verifyPaymentSignature } = require('../services/razorpayService');
const { sendOrderConfirmationSMS, sendPaymentSuccessSMS } = require('../services/smsService');
const { deductInventoryForOrder } = require('../models/inventoryModel');
const { calculateDeliveryForCart } = require('../services/deliveryService');
// WhatsApp integration commented out - using SMS only
// const { sendOrderConfirmationWhatsApp } = require('../whatsapp/whatsAppServices');

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
      amount, // This is the item total from frontend
      paymentMode,
    } = req.body;

    // Calculate delivery charge and total weight
    const { totalWeightGrams, deliveryCharge } = await calculateDeliveryForCart(cartItems);

    // Calculate final order total: item total + delivery charge
    const itemTotal = parseFloat(amount) || 0;
    const finalAmount = itemTotal + deliveryCharge;

    let razorpayOrderId = null;
    let orderStatus = 'pending';

    // If payment mode is Razorpay, create Razorpay order first
    if (paymentMode === 'razorpay') {
      try {
        const razorpayOrder = await createRazorpayOrder(finalAmount, 'INR', {
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

    // Create order in database with delivery charge and total weight
    const orderData = {
      customerName,
      customerPhone,
      deliveryAddress,
      cartItems,
      amount: finalAmount, // Store final amount (item total + delivery charge)
      paymentMode,
      razorpayOrderId,
      status: orderStatus,
      deliveryCharge,
      totalWeightGrams,
    };

    const order = await createOrder(orderData);

    // Send SMS for COD orders immediately
    if (paymentMode === 'cod') {
      const estimatedDelivery = '30-45 minutes';
      await sendOrderConfirmationSMS(customerPhone, {
        orderId: order.id,
        amount: finalAmount,
        estimatedDelivery: estimatedDelivery,
      });

      // WhatsApp notification commented out - using SMS only
      // sendOrderConfirmationWhatsApp(customerPhone, customerName, order.id)
      //   .catch(console.error);
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
        itemTotal: itemTotal,
        deliveryCharge: deliveryCharge,
        totalWeightGrams: totalWeightGrams,
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

    // WhatsApp notification commented out - using SMS only
    // sendOrderConfirmationWhatsApp(order.customer_phone, order.customer_name, order.id)
    //   .catch(console.error);

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
 * POST /api/orders/calculate-delivery
 * Calculate delivery charge for cart items (for order summary display)
 */
router.post('/calculate-delivery', async (req, res, next) => {
  try {
    const { cartItems } = req.body;

    if (!cartItems || !Array.isArray(cartItems)) {
      return res.status(400).json({
        success: false,
        error: 'Cart items are required',
      });
    }

    // Calculate delivery charge and total weight
    const { totalWeightGrams, deliveryCharge } = await calculateDeliveryForCart(cartItems);

    // Calculate item total from cart items
    const itemTotal = cartItems.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 0;
      return sum + (price * quantity);
    }, 0);

    // Calculate order total
    const orderTotal = itemTotal + deliveryCharge;

    res.json({
      success: true,
      itemTotal: Math.round(itemTotal * 100) / 100,
      totalWeightGrams,
      deliveryCharge,
      orderTotal: Math.round(orderTotal * 100) / 100,
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
        const deliveryCharge = order.delivery_charge != null ? parseFloat(order.delivery_charge) : 0
        const itemTotal = amount - deliveryCharge
        return {
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
    const deliveryCharge = order.delivery_charge != null ? parseFloat(order.delivery_charge) : 0
    const itemTotal = amount - deliveryCharge
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


