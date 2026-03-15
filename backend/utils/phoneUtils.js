/**
 * Phone number normalization for SMS (Twilio) and WhatsApp.
 * Produces E.164 format (+countryCode+digits) so the same value works for both.
 */

require('dotenv').config();

const DEFAULT_COUNTRY_CODE = (process.env.DEFAULT_PHONE_COUNTRY_CODE || '91').trim() || '91';

/**
 * Normalize a phone number to E.164 format (+countryCode+digits).
 * - Strips all non-digit characters (spaces, +, -, etc.)
 * - For 10-digit Indian mobile (starts with 6,7,8,9), prepends default country code (91)
 * - Returns value with leading + for Twilio; WhatsApp can strip the + when sending
 *
 * @param {string} phone - Raw input (e.g. "9884338885", "91 9884338885", "+91-9884338885")
 * @param {string} [defaultCountryCode] - Country code to prepend for 10-digit local numbers (default from env or '91')
 * @returns {string|null} E.164 string (e.g. "+919884338885") or null if invalid/empty
 */
function normalizePhone(phone, defaultCountryCode = DEFAULT_COUNTRY_CODE) {
  if (phone == null || String(phone).trim() === '') return null;
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 0) return null;
  let normalized = digits;
  // 10-digit Indian mobile (6,7,8,9): prepend country code
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    normalized = defaultCountryCode + digits;
  }
  return '+' + normalized;
}

module.exports = { normalizePhone };
