/**
 * Application Configuration
 * Centralized configuration for shop name and other settings
 * 
 * To customize the shop name, set NEXT_PUBLIC_SHOP_NAME in your .env.local file
 * Example: NEXT_PUBLIC_SHOP_NAME=My Sweet Shop
 */

export const appConfig = {
  shopName: process.env.NEXT_PUBLIC_SHOP_NAME || 'Siva Ganapathy Sweets',
  shopDescription: process.env.NEXT_PUBLIC_SHOP_DESCRIPTION || 'Your one-stop destination for delicious sweets and savories.',
}
