const express = require('express');
const router = express.Router();
const { getOrderByRazorpayOrderId, updateOrderStatus } = require('../models/orderModel');
const { verifyWebhookSignature, fetchPaymentDetails } = require('../services/razorpayService');
const { sendPaymentSuccessSMS, sendOrderConfirmationSMS } = require('../services/smsService');

/**
 * Webhook Routes
 * Handles Razorpay webhook events for payment status updates
 * 
 * Important: Configure this endpoint in Razorpay Dashboard:
 * Settings > Webhooks > Add New Webhook
 * URL: https://yourdomain.com/api/webhooks/razorpay
 * Events: payment.authorized, payment.captured, payment.failed
 */

/**
 * POST /api/webhooks/razorpay
 * Handle Razorpay webhook events
 * This endpoint should be publicly accessible and handle idempotency
 */
router.post('/razorpay', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // Get webhook signature from headers
    const webhookSignature = req.headers['x-razorpay-signature'];
    
    if (!webhookSignature) {
      console.error('Webhook signature missing');
      return res.status(400).json({
        success: false,
        error: 'Webhook signature missing',
      });
    }

    // Verify webhook signature
    const webhookBody = req.body.toString();
    const isSignatureValid = verifyWebhookSignature(webhookBody, webhookSignature);

    if (!isSignatureValid) {
      console.error('Invalid webhook signature');
      return res.status(400).json({
        success: false,
        error: 'Invalid webhook signature',
      });
    }

    // Parse webhook payload
    const event = JSON.parse(webhookBody);
    console.log('Received webhook event:', event.event, event.payload);

    // Handle different webhook events
    const { event: eventType, payload } = event;

    if (eventType === 'payment.authorized' || eventType === 'payment.captured') {
      // Payment successful
      const paymentEntity = payload.payment?.entity || payload.payment;
      const razorpayOrderId = paymentEntity.order_id;
      const razorpayPaymentId = paymentEntity.id;

      // Find order by Razorpay order ID
      const order = await getOrderByRazorpayOrderId(razorpayOrderId);

      if (!order) {
        console.error('Order not found for Razorpay order ID:', razorpayOrderId);
        return res.status(404).json({
          success: false,
          error: 'Order not found',
        });
      }

      // Check if already processed (idempotency)
      if (order.status === 'paid' || order.status === 'confirmed') {
        console.log('Order already processed:', order.id);
        return res.json({
          success: true,
          message: 'Order already processed',
        });
      }

      // Fetch payment details to get signature
      let paymentSignature = null;
      try {
        const paymentDetails = await fetchPaymentDetails(razorpayPaymentId);
        paymentSignature = paymentDetails.signature || null;
      } catch (error) {
        console.error('Error fetching payment details:', error);
      }

      // Update order status
      await updateOrderStatus(order.id, 'paid', {
        razorpayPaymentId,
        razorpaySignature: paymentSignature,
      });

      // Send confirmation SMS
      await sendPaymentSuccessSMS(order.customer_phone, {
        orderId: order.id,
        paymentId: razorpayPaymentId,
        amount: order.amount,
      });

      const estimatedDelivery = '30-45 minutes';
      await sendOrderConfirmationSMS(order.customer_phone, {
        orderId: order.id,
        amount: order.amount,
        estimatedDelivery: estimatedDelivery,
      });

      console.log('✅ Order updated successfully:', order.id);
    } else if (eventType === 'payment.failed') {
      // Payment failed
      const paymentEntity = payload.payment?.entity || payload.payment;
      const razorpayOrderId = paymentEntity.order_id;

      const order = await getOrderByRazorpayOrderId(razorpayOrderId);

      if (order && order.status !== 'paid' && order.status !== 'confirmed') {
        await updateOrderStatus(order.id, 'payment_failed');
        console.log('❌ Payment failed for order:', order.id);
      }
    }

    // Always return 200 to acknowledge webhook receipt
    res.json({
      success: true,
      message: 'Webhook processed',
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    // Still return 200 to prevent Razorpay from retrying
    res.status(200).json({
      success: false,
      error: 'Error processing webhook',
    });
  }
});

module.exports = router;










