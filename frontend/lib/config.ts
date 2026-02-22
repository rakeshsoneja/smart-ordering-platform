/**
 * Application Configuration
 * Centralized configuration for shop name and other settings
 * 
 * To customize the shop name, set NEXT_PUBLIC_SHOP_NAME in your .env.local file
 * Example: NEXT_PUBLIC_SHOP_NAME=My Sweet Shop
 * 
 * To customize the shop phone number, set NEXT_PUBLIC_SHOP_PHONE_NUMBER in your .env.local file
 * Example: NEXT_PUBLIC_SHOP_PHONE_NUMBER=+91 8667377257
 */

export const appConfig = {
  shopName: process.env.NEXT_PUBLIC_SHOP_NAME || 'Siva Ganapathy Sweets',
  shopDescription: process.env.NEXT_PUBLIC_SHOP_DESCRIPTION || 'Your one-stop destination for delicious sweets and savories.',
  shopPhoneNumber: process.env.NEXT_PUBLIC_SHOP_PHONE_NUMBER || '+91 8667377257',
}
