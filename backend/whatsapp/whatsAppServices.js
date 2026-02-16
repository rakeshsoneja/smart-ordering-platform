/**
 * WhatsApp Cloud API Service
 * Handles sending WhatsApp messages via Meta's WhatsApp Cloud API
 */

const axios = require('axios');
const whatsAppConfig = require('./whatsAppConfig');

/**
 * Send order confirmation WhatsApp message using template
 * @param {string} phoneNumber - Customer phone number (with country code, e.g., "919876543210")
 * @param {string} customerName - Customer name
 * @param {number} orderId - Order ID
 * @returns {Promise<void>}
 */
const sendOrderConfirmationWhatsApp = async (phoneNumber, customerName, orderId) => {
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

  // Validate required parameters
  if (!customerName || !orderId) {
    console.error('❌ WhatsApp: Missing required parameters (customerName or orderId).');
    return;
  }

  try {
    // Prepare request URL
    const url = `${whatsAppConfig.apiBaseUrl}/${whatsAppConfig.phoneNumberId}/messages`;

    // Prepare request payload with template
    const payload = {
      messaging_product: 'whatsapp',
      to: phoneNumber.trim(),
      type: 'template',
      template: {
        name: 'order_confirmation',
        language: {
          code: 'en_US',
        },
        components: [
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                text: customerName,
              },
              {
                type: 'text',
                text: orderId.toString(),
              },
            ],
          },
        ],
      },
    };

    // Prepare request headers
    const headers = {
      'Authorization': `Bearer ${whatsAppConfig.accessToken}`,
      'Content-Type': 'application/json',
    };

    // Send WhatsApp message
    const response = await axios.post(url, payload, { headers });

    // Log success
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

