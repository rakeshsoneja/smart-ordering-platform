/**
 * Application Configuration
 * Centralized configuration for shop name and other settings
 *
 * Set values in `.env.local` (NEXT_PUBLIC_* variables).
 */

function trimEnv(value: string | undefined): string {
  return (value || '').trim()
}

export const appConfig = {
  shopName: process.env.NEXT_PUBLIC_SHOP_NAME || 'Siva Ganapathy Sweets',
  themeKey: process.env.NEXT_PUBLIC_THEME_KEY || 'default',
  shopDescription:
    process.env.NEXT_PUBLIC_SHOP_DESCRIPTION ||
    'Your one-stop destination for delicious sweets and savories.',
  shopPhoneNumber: process.env.NEXT_PUBLIC_SHOP_PHONE_NUMBER || '+91 8667377257',

  shopAddressLine1: trimEnv(process.env.NEXT_PUBLIC_SHOP_ADDRESS_LINE_1),
  shopAddressLine2: trimEnv(process.env.NEXT_PUBLIC_SHOP_ADDRESS_LINE_2),
  shopCity: trimEnv(process.env.NEXT_PUBLIC_SHOP_CITY),
  shopState: trimEnv(process.env.NEXT_PUBLIC_SHOP_STATE),
  shopPincode: trimEnv(process.env.NEXT_PUBLIC_SHOP_PINCODE),
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
