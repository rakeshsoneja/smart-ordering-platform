# Sweet Shop Ordering System

A full-stack e-commerce application for a sweet shop with integrated payment processing, SMS notifications, and order management.

## Tech Stack

- **Frontend**: React.js + Next.js 14 (App Router)
- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL
- **Payment**: Razorpay
- **SMS**: Twilio

## Project Structure

```
orderingapp/
├── backend/          # Node.js + Express backend
│   ├── database/     # Database schema and connection
│   ├── models/       # Data models
│   ├── routes/       # API routes
│   ├── services/     # Business logic (Razorpay, SMS)
│   ├── middleware/   # Express middleware
│   └── server.js     # Entry point
│
└── frontend/         # Next.js frontend
    ├── app/          # Next.js app directory
    ├── components/    # React components
    └── context/      # React context providers
```

## Features

✅ Shopping cart with add/remove items  
✅ Order placement with customer details  
✅ Razorpay payment integration (UPI/Card)  
✅ Cash on Delivery (COD) option  
✅ Payment verification and webhook handling  
✅ SMS order confirmation  
✅ Order status tracking  
✅ Modern, responsive UI  
✅ Secure payment processing  

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- Razorpay account
- Twilio account (for SMS)

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Database Setup**
   - Create PostgreSQL database:
     ```sql
     CREATE DATABASE sweet_shop_db;
     ```
   - Run schema:
     ```bash
     psql -U postgres -d sweet_shop_db -f database/schema.sql
     ```

4. **Environment Variables**
   - Copy `.env.example` to `.env`
   - Fill in all required variables:
     ```env
     PORT=5000
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

5. **Run backend server**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Variables**
   - Copy `.env.example` to `.env.local`
   - Fill in:
     ```env
     NEXT_PUBLIC_API_URL=http://localhost:5000
     NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
     ```

4. **Run frontend**
   ```bash
   npm run dev
   ```

5. **Open browser**
   - Navigate to `http://localhost:3000`

## API Endpoints

### Orders
- `POST /api/orders` - Create a new order
- `POST /api/orders/verify-payment` - Verify Razorpay payment
- `GET /api/orders/:orderId` - Get order details

### Webhooks
- `POST /api/webhooks/razorpay` - Razorpay webhook endpoint

## Razorpay Setup

1. **Create Razorpay Account**
   - Sign up at https://razorpay.com
   - Get your Key ID and Key Secret from Dashboard

2. **Configure Webhook**
   - Go to Settings > Webhooks
   - Add webhook URL: `https://yourdomain.com/api/webhooks/razorpay`
   - Select events: `payment.authorized`, `payment.captured`, `payment.failed`
   - Save webhook secret

3. **Test Mode**
   - Use test keys for development
   - Test cards: https://razorpay.com/docs/payments/test-cards/

## Twilio Setup

1. **Create Twilio Account**
   - Sign up at https://www.twilio.com
   - Get Account SID and Auth Token
   - Get a phone number (for India, use Twilio's India numbers)

2. **Configure Environment**
   - Add credentials to backend `.env`

## Security Best Practices

✅ Payment signature verification  
✅ Webhook signature verification  
✅ Environment variables for sensitive data  
✅ Input validation and sanitization  
✅ HTTPS in production  
✅ CORS configuration  
✅ Error handling and logging  

## Production Deployment

### Backend
- Use HTTPS
- Set `NODE_ENV=production`
- Use secure database credentials
- Configure proper CORS origins
- Set up webhook URL in Razorpay dashboard

### Frontend
- Build: `npm run build`
- Start: `npm start`
- Configure environment variables
- Use HTTPS

## Testing

### Test Payment Flow
1. Add items to cart
2. Proceed to checkout
3. Fill in customer details
4. Select payment mode
5. For Razorpay: Use test cards
6. Verify order confirmation

### Test Webhook
- Use Razorpay webhook testing tool
- Or use ngrok to expose local server

## Troubleshooting

### Database Connection Issues
- Check PostgreSQL is running
- Verify database credentials
- Check connection string format

### Razorpay Issues
- Verify API keys are correct
- Check webhook URL is accessible
- Verify signature verification logic

### SMS Not Sending
- Check Twilio credentials
- Verify phone number format (+91XXXXXXXXXX)
- Check Twilio account balance

## License

MIT

## Support

For issues and questions, please check the documentation or contact support.












