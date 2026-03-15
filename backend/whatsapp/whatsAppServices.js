/**
 * WhatsApp Cloud API Service
 * Handles sending WhatsApp messages via Meta's WhatsApp Cloud API
 */

const axios = require('axios');
const whatsAppConfig = require('./whatsAppConfig');
const { normalizePhone } = require('../utils/phoneUtils');

/**
 * Send order confirmation WhatsApp message using template
 * @param {string} phoneNumber - Customer phone number (with country code, e.g., "919876543210")
 * @param {string} customerName - Customer name
 * @param {number} orderId - Order ID
 * @param {string|null} [secureToken] - Optional JWT for "Order Details" button URL (order-details page). Do not pass order_id in URL.
 * @param {string|null} [qrImageUrl] - Optional UPI QR image URL (e.g. from Cloudinary) for template header.
 * @returns {Promise<void>}
 */
const sendOrderConfirmationWhatsApp = async (phoneNumber, customerName, orderId, secureToken = null, qrImageUrl = null) => {
  // Check if WhatsApp is enabled
  if (!whatsAppConfig.enabled) {
    console.log('📱 WhatsApp is disabled. Skipping WhatsApp notification.');
    return;
  }

  // Validate required configuration
  if (!whatsAppConfig.accessToken || !whatsAppConfig.phoneNumberId) {
    console.error('❌ WhatsApp configuration incomplete. Missing accessToken or phoneNumberId.');
    return;
  }

  // Validate phone number format (should include country code)
  if (!phoneNumber || phoneNumber.trim() === '') {
    console.error('❌ WhatsApp: Invalid phone number provided.');
    return;
  }

  // Normalize to E.164 (same format as order creation); WhatsApp API needs digits-only in payload
  const normalized = normalizePhone(phoneNumber);
  const toNumber = normalized ? normalized.replace(/^\+/, '') : phoneNumber.trim().replace(/\D/g, '') || phoneNumber.trim();

  // Validate required parameters
  if (!customerName || !orderId) {
    console.error('❌ WhatsApp: Missing required parameters (customerName or orderId).');
    return;
  }

  try {
    // Prepare request URL
    const url = `${whatsAppConfig.apiBaseUrl}/${whatsAppConfig.phoneNumberId}/messages`;

    // Template components: header (QR image when provided), body, optional button
    const components = [];

    if (qrImageUrl && qrImageUrl.trim()) {
      components.push({
        type: 'header',
        parameters: [{ type: 'image', image: { link: qrImageUrl.trim() } }],
      });
    }

    components.push({
      type: 'body',
      parameters: [
        { type: 'text', text: customerName },
        { type: 'text', text: orderId.toString() },
      ],
    });

    if (secureToken) {
      components.push({
        type: 'button',
        sub_type: 'url',
        index: '0',
        parameters: [
          { type: 'text', text: secureToken },
        ],
      });
    }

    const payload = {
      messaging_product: 'whatsapp',
      to: toNumber,
      type: 'template',
      template: {
        name: 'order_payment_qr',
        language: { code: 'en' },
        components,
      },
    };

    // Prepare request headers
    const headers = {
      'Authorization': `Bearer ${whatsAppConfig.accessToken}`,
      'Content-Type': 'application/json',
    };

    console.log('📱 WhatsApp: Sending order confirmation template', { orderId, phoneNumber: phoneNumber.replace(/\d(?=\d{4})/g, '*') });
    console.log('📱 WhatsApp payload:', JSON.stringify(payload, null, 2));

    // Send WhatsApp message
    const response = await axios.post(url, payload, { headers });

    console.log('📱 WhatsApp API response:', JSON.stringify(response.data, null, 2));
    console.log('✅ WhatsApp message sent successfully:', {
      messageId: response.data?.messages?.[0]?.id,
      phoneNumber: phoneNumber,
      orderId: orderId,
    });

    return response.data;
  } catch (error) {
    // Log error but don't throw (non-blocking)
    console.error('❌ Error sending WhatsApp message:', {
      phoneNumber: phoneNumber,
      orderId: orderId,
      error: error.response?.data || error.message,
    });
    
    // Don't throw error - WhatsApp failure should not block order confirmation
    return null;
  }
};

module.exports = {
  sendOrderConfirmationWhatsApp,
};

