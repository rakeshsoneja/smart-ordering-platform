/**
 * WhatsApp Cloud API Configuration
 * Reads configuration from environment variables
 */

require('dotenv').config();

const whatsAppConfig = {
  enabled: process.env.WHATSAPP_ENABLED === 'true',
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  apiBaseUrl: process.env.WHATSAPP_API_BASE_URL || 'https://graph.facebook.com/v18.0',
  webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || '',
};

module.exports = whatsAppConfig;




