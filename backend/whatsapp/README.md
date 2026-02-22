# WhatsApp Cloud API Integration

This directory contains the WhatsApp Cloud API integration for sending order confirmation messages and handling webhook events.

## Files

- `whatsAppConfig.js` - Configuration loader from environment variables
- `whatsAppServices.js` - Service for sending WhatsApp messages
- `whatsAppWebhook.js` - Webhook handler for Meta's verification and events

## Environment Variables

Add the following to your `backend/.env` file:

```env
# WhatsApp Configuration
WHATSAPP_ENABLED=true
WHATSAPP_ACCESS_TOKEN=your_access_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_API_BASE_URL=https://graph.facebook.com/v18.0
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_verify_token_here
```

## Setup Instructions

1. **Get WhatsApp Business API Credentials:**
   - Go to [Meta for Developers](https://developers.facebook.com/)
   - Create a WhatsApp Business App
   - Get your Access Token and Phone Number ID

2. **Configure Webhook:**
   - In Meta Developer Console, set webhook URL to: `https://yourdomain.com/webhook/whatsapp`
   - Set verify token to match `WHATSAPP_WEBHOOK_VERIFY_TOKEN` in your `.env`

3. **Phone Number Format:**
   - Phone numbers must include country code (e.g., "919876543210" for India)
   - No + sign or spaces

## Endpoints

- `GET /webhook/whatsapp` - Webhook verification (called by Meta)
- `POST /webhook/whatsapp` - Webhook events (receives messages, status updates)

## Usage

WhatsApp notifications are automatically sent when:
- COD orders are confirmed
- Razorpay payments are verified

The service is non-blocking and will not affect order processing if WhatsApp fails.

## Security

- All credentials are stored in `.env` file (already in `.gitignore`)
- No credentials are exposed to frontend
- WhatsApp API calls only made from backend





