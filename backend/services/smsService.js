const twilio = require('twilio');
require('dotenv').config();

/**
 * SMS Service - Handles sending SMS notifications using Twilio
 * For India, you can also use Fast2SMS or other local providers
 */

// Initialize Twilio client
let twilioClient = null;

// Validate and initialize Twilio only if credentials are valid
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

if (accountSid && authToken && accountSid.trim() !== '' && authToken.trim() !== '') {
  // Validate that account SID starts with "AC" (Twilio requirement)
  if (accountSid.trim().startsWith('AC')) {
    try {
      twilioClient = twilio(accountSid.trim(), authToken.trim());
      console.log('✅ Twilio client initialized successfully');
    } catch (error) {
      console.warn('⚠️  Failed to initialize Twilio client:', error.message);
      twilioClient = null;
    }
  } else {
    console.warn('⚠️  Twilio Account SID is invalid (must start with "AC"). SMS service will not be available.');
  }
} else {
  console.warn('⚠️  Twilio credentials not configured. SMS service will not be available.');
}

/**
 * Send order confirmation SMS
 * @param {string} phoneNumber - Customer phone number (with country code, e.g., +91XXXXXXXXXX)
 * @param {object} orderDetails - Order details object
 * @returns {Promise<object>} SMS sending result
 */
const sendOrderConfirmationSMS = async (phoneNumber, orderDetails) => {
  // If Twilio is not configured, log and return
  if (!twilioClient) {
    console.warn('⚠️  Twilio not configured. SMS will not be sent.');
    console.log('Would send SMS to:', phoneNumber, 'with order:', orderDetails);
    return { success: false, message: 'SMS service not configured' };
  }

  try {
    // Use as-is if already E.164 (+...); otherwise prepend + (normalized value is E.164 from order creation)
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

    // Create SMS message
    const message = `🎉 Order Confirmed!\n\nOrder ID: ${orderDetails.orderId}\nAmount: ₹${orderDetails.amount}\n\nThank you for your order!`;

    // Send SMS
    const messageResult = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone,
    });

    console.log('✅ SMS sent successfully:', messageResult.sid);
    return {
      success: true,
      messageSid: messageResult.sid,
      message: 'SMS sent successfully',
    };
  } catch (error) {
    console.error('❌ Error sending SMS:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to send SMS',
    };
  }
};

/**
 * Send payment success SMS
 * @param {string} phoneNumber - Customer phone number
 * @param {object} paymentDetails - Payment details
 * @returns {Promise<object>} SMS sending result
 */
const sendPaymentSuccessSMS = async (phoneNumber, paymentDetails) => {
  if (!twilioClient) {
    console.warn('⚠️  Twilio not configured. SMS will not be sent.');
    return { success: false, message: 'SMS service not configured' };
  }

  try {
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

    const message = `✅ Payment Successful!\n\nOrder ID: ${paymentDetails.orderId}\nPayment ID: ${paymentDetails.paymentId}\nAmount: ₹${paymentDetails.amount}\n\nYour order is being processed.`;

    const messageResult = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone,
    });

    console.log('✅ Payment confirmation SMS sent:', messageResult.sid);
    return {
      success: true,
      messageSid: messageResult.sid,
    };
  } catch (error) {
    console.error('❌ Error sending payment SMS:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

module.exports = {
  sendOrderConfirmationSMS,
  sendPaymentSuccessSMS,
};


