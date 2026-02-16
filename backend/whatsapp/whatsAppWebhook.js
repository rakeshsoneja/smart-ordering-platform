/**
 * WhatsApp Cloud API Webhook Handler
 * Handles webhook verification and incoming webhook events from Meta
 */

const express = require('express');
const router = express.Router();
const whatsAppConfig = require('./whatsAppConfig');

/**
 * GET /webhook/whatsapp
 * Webhook verification endpoint
 * Meta will call this endpoint to verify the webhook
 */
router.get('/webhook/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Check if this is a verification request
  if (mode === 'subscribe' && token === whatsAppConfig.webhookVerifyToken) {
    console.log('✅ WhatsApp webhook verified successfully');
    res.status(200).send(challenge);
  } else {
    console.error('❌ WhatsApp webhook verification failed:', {
      mode,
      tokenProvided: !!token,
      tokenMatches: token === whatsAppConfig.webhookVerifyToken,
    });
    res.status(403).send('Forbidden');
  }
});

/**
 * POST /webhook/whatsapp
 * Webhook event handler
 * Receives incoming webhook events from Meta (messages, status updates, etc.)
 */
router.post('/webhook/whatsapp', (req, res) => {
  // Respond immediately with 200 OK (don't block)
  res.status(200).send('OK');

  // Process webhook payload asynchronously
  const body = req.body;

  // Log webhook payload for debugging
  console.log('📱 WhatsApp webhook received:', JSON.stringify(body, null, 2));

  // Handle different webhook event types
  if (body.object === 'whatsapp_business_account') {
    body.entry?.forEach((entry) => {
      entry.changes?.forEach((change) => {
        if (change.field === 'messages') {
          const value = change.value;

          // Handle incoming messages
          if (value.messages) {
            value.messages.forEach((message) => {
              console.log('📨 Incoming WhatsApp message:', {
                from: message.from,
                messageId: message.id,
                type: message.type,
                timestamp: message.timestamp,
              });
            });
          }

          // Handle message status updates
          if (value.statuses) {
            value.statuses.forEach((status) => {
              console.log('📊 WhatsApp message status update:', {
                messageId: status.id,
                status: status.status,
                recipientId: status.recipient_id,
                timestamp: status.timestamp,
              });
            });
          }
        }
      });
    });
  }

  // Note: Add your custom webhook event handling logic here
  // For example: auto-reply, order status updates, etc.
});

module.exports = router;




