/**
 * WhatsApp Cloud API Configuration
 * Reads configuration from environment variables
 */

require('dotenv').config();

// WhatsApp is enabled only when WHATSAPP_ENABLED is explicitly 'true' (case-insensitive).
// When missing, not set, empty, or false, WhatsApp must not be triggered.
const whatsAppConfig = {
  enabled: (process.env.WHATSAPP_ENABLED || '').toLowerCase() === 'true',
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  apiBaseUrl: process.env.WHATSAPP_API_BASE_URL || 'https://graph.facebook.com/v18.0',
  webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || '',
};

module.exports = whatsAppConfig;





