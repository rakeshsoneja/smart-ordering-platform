# Architecture Overview

## System Architecture

```
┌─────────────────┐
│   Frontend      │
│  (Next.js)      │
│  Port: 3000     │
└────────┬────────┘
         │ HTTP/REST API
         │
┌────────▼────────┐
│   Backend       │
│  (Express.js)   │
│  Port: 5000     │
└────────┬────────┘
         │
    ┌────┴────┬──────────┬──────────┐
    │         │          │          │
┌───▼───┐ ┌──▼───┐  ┌───▼───┐  ┌───▼───┐
│PostgreSQL│ │Razorpay│  │ Twilio │  │Webhook│
│Database │ │Payment │  │  SMS   │  │Events │
└─────────┘ └───────┘  └────────┘  └───────┘
```

## Data Flow

### Order Placement Flow

1. **User adds items to cart** (Frontend - localStorage)
2. **User proceeds to checkout** → Frontend validates form
3. **Frontend sends order request** → Backend API
4. **Backend creates order** → PostgreSQL database
5. **If Razorpay**: Backend creates Razorpay order → Returns order ID
6. **Frontend opens Razorpay checkout** → User completes payment
7. **Razorpay redirects** → Frontend verifies payment with backend
8. **Backend verifies signature** → Updates order status
9. **Backend sends SMS** → Twilio API
10. **User sees confirmation** → Order confirmation page

### Webhook Flow (Razorpay)

1. **Payment event occurs** → Razorpay sends webhook
2. **Backend receives webhook** → Verifies signature
3. **Backend processes event** → Updates order status
4. **Backend sends SMS** → Twilio API
5. **Backend responds 200** → Acknowledges receipt

## Key Components

### Backend

#### Routes
- **`/api/orders`** - Order creation and management
- **`/api/orders/verify-payment`** - Payment verification
- **`/api/webhooks/razorpay`** - Webhook handler

#### Services
- **`razorpayService.js`** - Payment processing
- **`smsService.js`** - SMS notifications

#### Models
- **`orderModel.js`** - Database operations

#### Middleware
- **`validateRequest.js`** - Input validation
- **`errorHandler.js`** - Error handling

### Frontend

#### Pages
- **`/`** - Product listing and cart
- **`/checkout`** - Order form and payment
- **`/order-confirmation`** - Order status

#### Components
- **`ProductCard`** - Product display
- **`Cart`** - Shopping cart modal
- **`Header/Footer`** - Layout components

#### Context
- **`cartContext.tsx`** - Global cart state

## Security Features

1. **Payment Signature Verification**
   - All Razorpay payments verified using HMAC SHA256
   - Prevents payment tampering

2. **Webhook Signature Verification**
   - Webhook events verified before processing
   - Prevents unauthorized webhook calls

3. **Input Validation**
   - Express-validator for request validation
   - Prevents invalid data entry

4. **Environment Variables**
   - Sensitive keys stored in .env
   - Never committed to version control

5. **CORS Configuration**
   - Restricted to frontend URL only
   - Prevents unauthorized API access

## Database Schema

### Orders Table
```sql
- id (SERIAL PRIMARY KEY)
- customer_name (VARCHAR)
- customer_phone (VARCHAR)
- delivery_address (TEXT)
- cart_items (JSONB)
- amount (DECIMAL)
- payment_mode (VARCHAR)
- razorpay_order_id (VARCHAR)
- razorpay_payment_id (VARCHAR)
- razorpay_signature (VARCHAR)
- status (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## Error Handling

- **Backend**: Centralized error handler middleware
- **Frontend**: Try-catch blocks with user-friendly messages
- **Payment Failures**: Graceful handling with retry options
- **SMS Failures**: Logged but don't block order processing

## Idempotency

- Webhook handler checks order status before processing
- Prevents duplicate processing of payment events
- Order status transitions are atomic

## Scalability Considerations

- Database connection pooling
- Stateless API design
- Frontend cart stored in localStorage (can migrate to backend)
- Webhook processing is async and non-blocking

## Future Enhancements

- User authentication and accounts
- Order history for logged-in users
- Multiple vendor support
- Product management admin panel
- Real-time order tracking
- Email notifications
- Inventory management











