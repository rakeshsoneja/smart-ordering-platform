/**
 * Application Configuration
 * Centralized configuration for shop name and other settings
 *
 * Set values in `.env.local` (NEXT_PUBLIC_* variables).
 */

function trimEnv(value: string | undefined): string {
  return (value || '').trim()
}

/** Comma-separated state codes, e.g. `TN` or `TN,KA`. Empty = all states in checkout. */
function parseStateCodes(value: string | undefined): string[] {
  if (!value?.trim()) return []
  return value
    .split(',')
    .map((code) => code.trim().toUpperCase())
    .filter(Boolean)
}

export const appConfig = {
  shopName: process.env.NEXT_PUBLIC_SHOP_NAME || 'Siva Ganapathy Sweets',
  themeKey: process.env.NEXT_PUBLIC_THEME_KEY || 'default',
  shopTagline: process.env.NEXT_PUBLIC_SHOP_TAGLINE || 'Fresh Products',
  shopDescription:
    process.env.NEXT_PUBLIC_SHOP_DESCRIPTION ||
    'Your one-stop destination for delicious sweets and savories.',
  shopPhoneNumber: process.env.NEXT_PUBLIC_SHOP_PHONE_NUMBER || '+91 8667377257',
  shopEmail: process.env.NEXT_PUBLIC_SHOP_EMAIL || 'info@sweetshop.com',

  shopAddressLine1: trimEnv(process.env.NEXT_PUBLIC_SHOP_ADDRESS_LINE_1),
  shopAddressLine2: trimEnv(process.env.NEXT_PUBLIC_SHOP_ADDRESS_LINE_2),
  shopCity: trimEnv(process.env.NEXT_PUBLIC_SHOP_CITY),
  shopState: trimEnv(process.env.NEXT_PUBLIC_SHOP_STATE),
  shopPincode: trimEnv(process.env.NEXT_PUBLIC_SHOP_PINCODE),

  /** Checkout state dropdown allowlist. Empty = show all Indian states. */
  allowedStateCodes: parseStateCodes(process.env.NEXT_PUBLIC_ALLOWED_STATE_CODES),
  /** Pre-selected state on checkout when valid and in allowlist. */
  defaultStateCode: trimEnv(process.env.NEXT_PUBLIC_DEFAULT_STATE_CODE).toUpperCase(),
}

/** Single line: `City - Pincode, State` (only defined parts included). */
export function formatReceiptCityPinStateLine(): string | null {
  const c = appConfig.shopCity
  const p = appConfig.shopPincode
  const s = appConfig.shopState

  let left = ''
  if (c && p) left = `${c} - ${p}`
  else if (c) left = c
  else if (p) left = p

  if (left && s) return `${left}, ${s}`
  if (left) return left
  if (s) return s
  return null
}

export function hasAnyShopAddressField(): boolean {
  return Boolean(
    appConfig.shopAddressLine1 ||
      appConfig.shopAddressLine2 ||
      appConfig.shopCity ||
      appConfig.shopState ||
      appConfig.shopPincode
  )
}
