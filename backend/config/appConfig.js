/**
 * Application configuration from environment variables.
 */

require('dotenv').config();

function parseStateCodes(value) {
  if (!value || !String(value).trim()) return [];
  return String(value)
    .split(',')
    .map((code) => code.trim().toUpperCase())
    .filter(Boolean);
}

const appConfig = {
  /** Order/checkout state allowlist. Empty = any valid state code accepted. */
  allowedStateCodes: parseStateCodes(process.env.ALLOWED_STATE_CODES),
};

function isStateCodeAllowed(stateCode) {
  const { allowedStateCodes } = appConfig;
  if (!allowedStateCodes.length) return true;
  if (!stateCode || typeof stateCode !== 'string') return false;
  return allowedStateCodes.includes(stateCode.trim().toUpperCase());
}

module.exports = {
  appConfig,
  isStateCodeAllowed,
  parseStateCodes,
};
