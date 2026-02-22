# Setup Guide

## Quick Start

### 1. Backend Setup

1. Navigate to backend folder:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file in `backend/` directory with:
   ```env
   PORT=5000
   NODE_ENV=development

   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=sweet_shop_db
   DB_USER=postgres
   DB_PASSWORD=your_password

   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret

   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_phone_number

   WEBHOOK_SECRET=your_webhook_secret

   FRONTEND_URL=http://localhost:3000
   ```

4. Setup PostgreSQL database:
   ```sql
   CREATE DATABASE sweet_shop_db;
   ```
   Then run:
   ```bash
   psql -U postgres -d sweet_shop_db -f database/schema.sql
   ```

5. Start backend:
   ```bash
   npm run dev
   ```

### 2. Frontend Setup

1. Navigate to frontend folder:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local` file in `frontend/` directory with:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000
   NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
   ```

4. Start frontend:
   ```bash
   npm run dev
   ```

5. Open browser: `http://localhost:3000`

## Getting API Keys

### Razorpay
1. Sign up at https://razorpay.com
2. Go to Dashboard > Settings > API Keys
3. Generate test keys
4. Copy Key ID and Key Secret

### Twilio
1. Sign up at https://www.twilio.com
2. Get Account SID and Auth Token from Console
3. Get a phone number (for India)

## Testing

- Use Razorpay test cards: https://razorpay.com/docs/payments/test-cards/
- Test webhook using ngrok or Razorpay webhook testing tool
















