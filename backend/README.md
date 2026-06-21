# Sweet Shop Backend API

Backend API for the sweet shop ordering system built with Node.js, Express.js, and PostgreSQL.

## Features

- Order management
- Razorpay payment integration
- SMS notifications via Twilio
- Webhook handling for payment events
- Secure payment verification

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Database Setup**
   - Install PostgreSQL if not already installed
   - Create a database:
     ```sql
     CREATE DATABASE sweet_shop_db;
     ```
   - Run the schema:
     ```bash
     psql -U postgres -d sweet_shop_db -f database/schema.sql
     ```
   - Or rely on `initSchema()` on first server start (see `server.js`).

3. **Optional: demo product seed (on demand)**  
   The server does **not** insert default products on startup. To load the bundled demo catalog (skips if `products` already has rows):
   ```bash
   npm run seed:products
   ```

4. **Environment Variables**
   - Copy `.env.example` to `.env`
   - Fill in all required environment variables:
     - Database credentials
     - Razorpay keys (from Razorpay Dashboard)
     - Twilio credentials (from Twilio Console)
     - Webhook secret

5. **Run the Server**
   ```bash
   # Development mode (with nodemon)
   npm run dev

   # Production mode
   npm start
   ```

## API Endpoints

### Health Check
- `GET /health` - Check server status

### Orders
- `POST /api/orders` - Create a new order
- `POST /api/orders/verify-payment` - Verify Razorpay payment
- `GET /api/orders/:orderId` - Get order details

### Public (no auth)
- `GET /api/public/order/:token` - Get order details by JWT token (e.g. from WhatsApp Order Details button). Returns 401 if token invalid/expired, 404 if order not found.

### Webhooks
- `POST /api/webhooks/razorpay` - Razorpay webhook endpoint

## Environment Variables

See `.env.example` for all required environment variables.

- **ORDER_LINK_SECRET** – Secret used to sign JWT for the WhatsApp "Order Details" link. Generate a secure random string (e.g. `openssl rand -base64 32`). Do not expose to the frontend. Required for secure order-details links.

### WhatsApp order confirmation template
- **WHATSAPP_ORDER_TEMPLATE_NAME** – Meta-approved template name (default: `order_payment_qr`).
- **WHATSAPP_ORDER_TEMPLATE_LANGUAGE** – Template language code (default: `en`).

### UPI Payment QR (WhatsApp order confirmation)
- **SHOP_UPI_ID** – Your UPI ID for receiving payments (e.g. `shopname@okaxis`, `store@paytm`).
- **SHOP_NAME** – Store display name (UPI QR payee name and WhatsApp template body parameter {{4}}).
- **SHOP_PHONE_NUMBER** – Store contact phone (WhatsApp template body parameter {{3}}). Match your frontend `NEXT_PUBLIC_SHOP_PHONE_NUMBER` if used there.
- **UPI_QR_IMAGE_URL** – Public URL of the UPI QR image (Cloudinary). Generate once via `npm run generate:upi-qr` and add the printed URL to `.env`.

## Security Notes

- Always use HTTPS in production
- Keep environment variables secure
- Verify all payment signatures
- Use webhook secret for additional security
















