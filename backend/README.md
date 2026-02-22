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

3. **Environment Variables**
   - Copy `.env.example` to `.env`
   - Fill in all required environment variables:
     - Database credentials
     - Razorpay keys (from Razorpay Dashboard)
     - Twilio credentials (from Twilio Console)
     - Webhook secret

4. **Run the Server**
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

### Webhooks
- `POST /api/webhooks/razorpay` - Razorpay webhook endpoint

## Environment Variables

See `.env.example` for all required environment variables.

## Security Notes

- Always use HTTPS in production
- Keep environment variables secure
- Verify all payment signatures
- Use webhook secret for additional security
















