# Architecture Document
## Sweet Shop Ordering System

**Version:** 2.0  
**Last Updated:** 2024  
**Document Owner:** Development Team

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Overview](#system-overview)
3. [Architecture Patterns](#architecture-patterns)
4. [System Architecture](#system-architecture)
5. [Component Architecture](#component-architecture)
6. [Data Architecture](#data-architecture)
7. [API Architecture](#api-architecture)
8. [Security Architecture](#security-architecture)
9. [Integration Architecture](#integration-architecture)
10. [Deployment Architecture](#deployment-architecture)
11. [Scalability & Performance](#scalability--performance)
12. [Error Handling & Resilience](#error-handling--resilience)
13. [Monitoring & Logging](#monitoring--logging)

---

## 1. Executive Summary

### 1.1 Purpose
This document describes the technical architecture of the Sweet Shop Ordering System, a full-stack e-commerce application enabling online ordering, payment processing, and order management.

### 1.2 Scope
- Frontend application (Next.js/React)
- Backend API (Node.js/Express)
- Database schema and data models
- Third-party integrations (Razorpay, Twilio, Cloudinary, WhatsApp)
- Security and authentication
- Deployment and infrastructure

### 1.3 Key Technologies
- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend:** Node.js, Express.js, PostgreSQL
- **Payment:** Razorpay
- **Notifications:** Twilio SMS, WhatsApp Business API
- **Storage:** Cloudinary (images), PostgreSQL (data)
- **Development:** TypeScript, ESLint, Nodemon

---

## 2. System Overview

### 2.1 System Purpose
The Sweet Shop Ordering System enables customers to:
- Browse products with variants
- Add items to cart with real-time inventory validation
- Place orders with multiple payment options
- Track orders and search order history
- Receive SMS/WhatsApp notifications

Administrators can:
- Manage products and variants
- Update inventory levels
- Process and update orders
- Monitor order status

### 2.2 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Web App    │  │  Mobile Web  │  │  Admin Panel │    │
│  │  (Next.js)   │  │  (Next.js)   │  │  (Next.js)   │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
└─────────┼─────────────────┼─────────────────┼────────────┘
          │                 │                 │
          └─────────────────┼─────────────────┘
                           │
          ┌────────────────▼────────────────┐
          │      API Gateway / Backend       │
          │      (Express.js Server)         │
          │      Port: 5000                  │
          └────────────────┬────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────▼──────┐  ┌────────▼────────┐  ┌─────▼──────┐
│  PostgreSQL  │  │   Services      │  │  External  │
│  Database    │  │   Layer         │  │  Services  │
│              │  │                 │  │            │
│  - Products  │  │ - Razorpay      │  │ - Razorpay │
│  - Variants  │  │ - SMS (Twilio)  │  │ - Twilio   │
│  - Inventory │  │ - Cloudinary    │  │ - Cloudinary│
│  - Orders    │  │ - WhatsApp      │  │ - WhatsApp │
└──────────────┘  └─────────────────┘  └────────────┘
```

### 2.3 System Boundaries

**In Scope:**
- Product catalog management
- Shopping cart functionality
- Order processing and management
- Payment integration (Razorpay)
- Inventory management
- SMS/WhatsApp notifications
- Admin panel

**Out of Scope (Future):**
- User authentication and accounts
- Product reviews and ratings
- Email notifications
- Advanced analytics
- Multi-vendor support
- Delivery tracking integration

---

## 3. Architecture Patterns

### 3.1 Architectural Style

**Pattern:** Layered Architecture (3-Tier)

```
┌─────────────────────────┐
│   Presentation Layer    │  (Frontend - Next.js)
├─────────────────────────┤
│   Application Layer     │  (Backend - Express.js)
├─────────────────────────┤
│   Data Layer            │  (PostgreSQL Database)
└─────────────────────────┘
```

### 3.2 Design Patterns

1. **MVC Pattern (Backend)**
   - **Models:** Database operations (`models/`)
   - **Views:** API responses (JSON)
   - **Controllers:** Route handlers (`routes/`)

2. **Service Layer Pattern**
   - Business logic separated into services (`services/`)
   - Reusable across routes
   - External API integrations

3. **Repository Pattern**
   - Data access abstraction (`models/`)
   - Database-agnostic operations
   - Centralized query logic

4. **Middleware Pattern**
   - Request validation (`validateRequest`)
   - Error handling (`errorHandler`)
   - CORS configuration

5. **Context Pattern (Frontend)**
   - Global state management (`cartContext.tsx`)
   - Shared cart state
   - Provider/Consumer pattern

---

## 4. System Architecture

### 4.1 Frontend Architecture

#### 4.1.1 Technology Stack
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **UI Library:** React 18
- **Styling:** Tailwind CSS
- **State Management:** React Context API
- **HTTP Client:** Axios
- **Payment SDK:** Razorpay

#### 4.1.2 Project Structure
```
frontend/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   ├── checkout/          # Checkout page
│   ├── cart/              # Cart page
│   ├── search/            # Order search
│   ├── track-order/       # Order tracking
│   ├── order-confirmation/# Order confirmation
│   └── admin/             # Admin panel
│       ├── page.tsx       # Admin dashboard
│       ├── product-maintenance/
│       └── order-maintenance/
├── components/            # Reusable components
│   ├── header.tsx
│   ├── footer.tsx
│   ├── productCard.tsx
│   ├── cart.tsx
│   └── ...
├── context/               # React Context
│   └── cartContext.tsx
├── lib/                   # Utilities
│   ├── axiosConfig.ts
│   └── config.ts
└── public/                # Static assets
```

#### 4.1.3 Key Frontend Components

**Cart Context (`cartContext.tsx`)**
- Manages global cart state
- Persists to localStorage
- Real-time inventory validation
- Stock availability messaging

**Product Card (`productCard.tsx`)**
- Displays product information
- Variant selection
- Add to cart functionality
- Stock status display

**Checkout Page (`checkout/page.tsx`)**
- Customer information form
- Payment method selection
- Razorpay integration
- Order submission

#### 4.1.4 State Management

**Local State:** React `useState` for component-specific state
**Global State:** React Context API for cart state
**Server State:** Axios for API calls, no caching layer currently

### 4.2 Backend Architecture

#### 4.2.1 Technology Stack
- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** JavaScript
- **Database:** PostgreSQL
- **ORM:** Native `pg` library
- **Validation:** Express-validator
- **File Upload:** Multer

#### 4.2.2 Project Structure
```
backend/
├── server.js              # Application entry point
├── database/              # Database layer
│   ├── dbConnection.js    # Database connection pool
│   ├── schema.sql         # Database schema
│   ├── initSchema.js      # Schema initialization
│   └── seedProducts.js    # Data seeding
├── models/                # Data models (Repository pattern)
│   ├── productModel.js
│   ├── variantModel.js
│   ├── inventoryModel.js
│   └── orderModel.js
├── routes/                # API routes (Controllers)
│   ├── productRoutes.js
│   ├── variantRoutes.js
│   ├── cartRoutes.js
│   ├── orderRoutes.js
│   ├── adminProductRoutes.js
│   ├── adminOrderRoutes.js
│   ├── inventoryRoutes.js
│   └── webhookRoutes.js
├── services/              # Business logic layer
│   ├── razorpayService.js
│   ├── smsService.js
│   └── cloudinaryService.js
├── middleware/            # Express middleware
│   ├── errorHandler.js
│   ├── validateRequest.js
│   └── uploadMiddleware.js
└── whatsapp/              # WhatsApp integration
    ├── whatsAppConfig.js
    ├── whatsAppServices.js
    └── whatsAppWebhook.js
```

#### 4.2.3 Request Flow

```
Client Request
    │
    ▼
Express Server (server.js)
    │
    ▼
CORS Middleware
    │
    ▼
Body Parser
    │
    ▼
Route Handler (routes/*.js)
    │
    ▼
Validation Middleware (validateRequest)
    │
    ▼
Controller Logic
    │
    ├─► Model Layer (models/*.js)
    │       │
    │       ▼
    │   Database Query (PostgreSQL)
    │
    ├─► Service Layer (services/*.js)
    │       │
    │       ├─► Razorpay API
    │       ├─► Twilio API
    │       └─► Cloudinary API
    │
    ▼
Response (JSON)
    │
    ▼
Error Handler (if error)
    │
    ▼
Client Response
```

---

## 5. Component Architecture

### 5.1 Backend Components

#### 5.1.1 Models Layer

**Purpose:** Abstract database operations

**Key Models:**

1. **ProductModel** (`models/productModel.js`)
   - `getAllProducts(filters)` - Get products with filters
   - `getProductById(id)` - Get single product
   - `createProduct(data)` - Create product
   - `updateProduct(id, data)` - Update product
   - `deleteProduct(id)` - Delete product

2. **VariantModel** (`models/variantModel.js`)
   - `getVariantsByProductId(productId)` - Get all variants
   - `createVariant(data)` - Create variant
   - `updateVariant(variantId, data)` - Update variant
   - `deleteVariant(variantId)` - Delete variant

3. **InventoryModel** (`models/inventoryModel.js`)
   - `getInventoryByProductId(productId)` - Get inventory
   - `updateInventory(productId, quantity)` - Update stock
   - `deductInventory(productId, quantity)` - Deduct stock
   - `checkAvailability(productId, requiredGrams)` - Check availability

4. **OrderModel** (`models/orderModel.js`)
   - `createOrder(data)` - Create order
   - `getOrderById(id)` - Get order
   - `getOrdersByPhone(phone)` - Search by phone
   - `updateOrderStatus(id, status)` - Update status
   - `updatePaymentDetails(id, paymentData)` - Update payment

#### 5.1.2 Services Layer

**Purpose:** Business logic and external integrations

**Key Services:**

1. **RazorpayService** (`services/razorpayService.js`)
   ```javascript
   - createRazorpayOrder(amount, currency, notes)
   - verifyPaymentSignature(orderId, paymentId, signature)
   - verifyWebhookSignature(payload, signature)
   ```

2. **SMSService** (`services/smsService.js`)
   ```javascript
   - sendOrderConfirmationSMS(phone, orderDetails)
   - sendOrderStatusUpdateSMS(phone, orderId, status)
   ```

3. **CloudinaryService** (`services/cloudinaryService.js`)
   ```javascript
   - uploadImage(file, folder)
   - deleteImage(publicId)
   ```

4. **WhatsAppService** (`whatsapp/whatsAppServices.js`)
   ```javascript
   - sendWhatsAppMessage(phone, message)
   - sendOrderConfirmation(phone, orderDetails)
   ```

#### 5.1.3 Middleware Layer

**Purpose:** Request processing and validation

1. **ErrorHandler** (`middleware/errorHandler.js`)
   - Centralized error handling
   - Consistent error response format
   - Error logging

2. **ValidateRequest** (`middleware/validateRequest.js`)
   - Express-validator integration
   - Request validation rules
   - Error message formatting

3. **UploadMiddleware** (`middleware/uploadMiddleware.js`)
   - Multer configuration
   - File size limits
   - File type validation

### 5.2 Frontend Components

#### 5.2.1 Page Components

1. **Home Page** (`app/page.tsx`)
   - Product listing
   - Category filtering
   - Product grid display

2. **Checkout Page** (`app/checkout/page.tsx`)
   - Customer form
   - Payment selection
   - Razorpay integration
   - Order submission

3. **Search Page** (`app/search/page.tsx`)
   - Order search by ID/phone
   - Results display
   - Order details modal

4. **Admin Pages** (`app/admin/*`)
   - Product management
   - Order management
   - Inventory management

#### 5.2.2 Reusable Components

1. **ProductCard** (`components/productCard.tsx`)
   - Product display
   - Variant selection
   - Add to cart

2. **Cart** (`components/cart.tsx`)
   - Cart modal
   - Item management
   - Quantity updates

3. **Header/Footer** (`components/header.tsx`, `footer.tsx`)
   - Navigation
   - Cart icon
   - Logo

---

## 6. Data Architecture

### 6.1 Database Schema

#### 6.1.1 Products Table
```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(10) NOT NULL CHECK (unit IN ('pc', 'gms')),
    unit_value INTEGER NOT NULL DEFAULT 1,
    image VARCHAR(255),
    category VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- `idx_product_category` on `category`
- `idx_product_status` on `status`

#### 6.1.2 Product Variant Table
```sql
CREATE TABLE product_variant (
    variant_id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_name VARCHAR(100) NOT NULL,
    variant_weight_grams INTEGER,
    variant_price DECIMAL(10, 2) NOT NULL,
    is_default_variant BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, variant_name)
);
```

**Indexes:**
- `idx_product_variant_product_id` on `product_id`
- `idx_product_variant_is_active` on `is_active`

#### 6.1.3 Product Inventory Table
```sql
CREATE TABLE product_inventory (
    inventory_id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
    available_quantity_grams INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- `idx_product_inventory_product_id` on `product_id`

**Note:** Inventory is maintained at product level, not variant level. All variants share the same product inventory pool.

#### 6.1.4 Orders Table
```sql
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    delivery_address TEXT NOT NULL,
    cart_items JSONB NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_mode VARCHAR(50) NOT NULL,
    razorpay_order_id VARCHAR(255),
    razorpay_payment_id VARCHAR(255),
    razorpay_signature VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- `idx_razorpay_order_id` on `razorpay_order_id`
- `idx_customer_phone` on `customer_phone`
- `idx_order_status` on `status`

**Cart Items JSONB Structure:**
```json
[
  {
    "id": 1,
    "variantId": 2,
    "variantName": "250g",
    "name": "Gulab Jamun",
    "price": 150.00,
    "quantity": 2,
    "variantWeightGrams": 250
  }
]
```

### 6.2 Data Relationships

```
products (1) ──< (many) product_variant
products (1) ──< (1) product_inventory
products (1) ──< (many) orders (via cart_items JSONB)
```

### 6.3 Data Flow

#### 6.3.1 Order Creation Flow
```
1. Customer adds items to cart (Frontend - localStorage)
2. Customer proceeds to checkout
3. Frontend sends order request to backend
4. Backend validates cart items and inventory
5. If COD: Deduct inventory immediately
6. If Razorpay: Create Razorpay order, don't deduct yet
7. Backend creates order record in database
8. Backend returns order details to frontend
9. If Razorpay: Frontend opens Razorpay checkout
10. Payment completion triggers webhook
11. Backend verifies payment and deducts inventory
12. Backend updates order status
13. Backend sends SMS/WhatsApp notification
```

#### 6.3.2 Inventory Management Flow
```
1. Admin updates inventory (via admin panel)
2. Backend validates quantity (>= 0)
3. Backend updates product_inventory table
4. Real-time validation on cart operations:
   - Calculate total required grams for all variants
   - Check against available_quantity_grams
   - Return availability status
5. On order placement (COD):
   - Atomic inventory deduction
   - Rollback if insufficient stock
```

### 6.4 Data Validation

**Backend Validation:**
- Express-validator for request validation
- Database constraints (CHECK, FOREIGN KEY)
- Business logic validation in models

**Frontend Validation:**
- Form validation before submission
- Real-time inventory validation
- Input sanitization

---

## 7. API Architecture

### 7.1 API Design Principles

1. **RESTful Design**
   - Resource-based URLs
   - HTTP methods (GET, POST, PUT, DELETE)
   - Status codes (200, 201, 400, 404, 500)

2. **Consistent Response Format**
   ```json
   {
     "success": true/false,
     "data": {...},
     "error": "error message"
   }
   ```

3. **Versioning**
   - Currently: `/api/*` (implicit v1)
   - Future: `/api/v2/*` for breaking changes

### 7.2 API Endpoints

#### 7.2.1 Product Endpoints
```
GET    /api/products              # Get all products
GET    /api/products/:id         # Get product by ID
POST   /api/admin/products       # Create product (Admin)
PUT    /api/admin/products/:id   # Update product (Admin)
DELETE /api/admin/products/:id   # Delete product (Admin)
```

#### 7.2.2 Variant Endpoints
```
GET    /api/variants/product/:productId  # Get variants
POST   /api/variants                     # Create variant
PUT    /api/variants/:variantId          # Update variant
DELETE /api/variants/:variantId          # Delete variant
```

#### 7.2.3 Cart Endpoints
```
POST   /api/cart/validate-inventory      # Validate inventory
```

#### 7.2.4 Order Endpoints
```
POST   /api/orders                       # Create order
GET    /api/orders/:orderId              # Get order
GET    /api/orders/search?phone=...     # Search by phone
POST   /api/orders/verify-payment        # Verify Razorpay payment
```

#### 7.2.5 Inventory Endpoints
```
GET    /api/inventory/product/:productId # Get inventory
PUT    /api/inventory/product/:productId # Update inventory
```

#### 7.2.6 Admin Endpoints
```
GET    /api/admin/orders                 # Get all orders
PUT    /api/admin/orders/:id/status      # Update order status
```

#### 7.2.7 Webhook Endpoints
```
POST   /api/webhooks/razorpay           # Razorpay webhook
POST   /whatsapp/webhook                 # WhatsApp webhook
```

### 7.3 API Authentication

**Current State:** No authentication (public API)
**Future:** JWT-based authentication for admin endpoints

### 7.4 API Rate Limiting

**Current State:** No rate limiting
**Future:** Implement rate limiting middleware

---

## 8. Security Architecture

### 8.1 Security Layers

#### 8.1.1 Payment Security

**Razorpay Integration:**
- Payment signature verification (HMAC SHA256)
- Webhook signature verification
- Server-side payment verification only
- No sensitive data in frontend

**Payment Flow Security:**
```
1. Backend creates Razorpay order (server-side only)
2. Frontend receives order ID (not sensitive)
3. Frontend opens Razorpay checkout (secure iframe)
4. Payment completion returns to frontend
5. Frontend sends payment details to backend
6. Backend verifies signature before processing
7. Backend updates order status only after verification
```

#### 8.1.2 Data Security

**Input Validation:**
- Express-validator for all inputs
- SQL injection prevention (parameterized queries)
- XSS prevention (input sanitization)

**Environment Variables:**
- Sensitive keys in `.env` files
- Never committed to version control
- Different keys for dev/prod

**Database Security:**
- Parameterized queries (pg library)
- Connection pooling
- No raw SQL with user input

#### 8.1.3 CORS Configuration

```javascript
// Development: Allow all origins (for mobile testing)
// Production: Restricted to FRONTEND_URL
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
```

#### 8.1.4 Webhook Security

**Razorpay Webhook:**
- Signature verification using webhook secret
- Idempotency checks (prevent duplicate processing)
- Secure endpoint (HTTPS in production)

**WhatsApp Webhook:**
- Token-based verification
- Request validation

### 8.2 Security Best Practices

1. **HTTPS in Production**
   - All API calls over HTTPS
   - Secure cookies (if implemented)

2. **Error Handling**
   - No sensitive information in error messages
   - Generic error messages to users
   - Detailed errors logged server-side only

3. **File Upload Security**
   - File type validation
   - File size limits
   - Secure storage (Cloudinary)

---

## 9. Integration Architecture

### 9.1 Third-Party Integrations

#### 9.1.1 Razorpay Integration

**Purpose:** Payment processing

**Integration Points:**
- Order creation (server-side)
- Payment verification (server-side)
- Webhook handling (server-side)

**Service:** `services/razorpayService.js`

**Flow:**
```
1. Backend creates Razorpay order
2. Returns order ID to frontend
3. Frontend opens Razorpay checkout
4. Payment completion → Frontend receives payment details
5. Frontend sends to backend for verification
6. Backend verifies signature
7. Backend processes payment
8. Razorpay sends webhook (async)
9. Backend processes webhook
```

#### 9.1.2 Twilio SMS Integration

**Purpose:** Order confirmation and status updates

**Service:** `services/smsService.js`

**Usage:**
- Order confirmation SMS
- Order status update SMS
- Payment confirmation SMS

**Configuration:**
- Account SID
- Auth Token
- Phone Number

#### 9.1.3 Cloudinary Integration

**Purpose:** Image storage and optimization

**Service:** `services/cloudinaryService.js`

**Features:**
- Image upload
- Automatic optimization
- CDN delivery
- Image deletion

#### 9.1.4 WhatsApp Business API

**Purpose:** Order notifications via WhatsApp

**Service:** `whatsapp/whatsAppServices.js`

**Features:**
- Order confirmation messages
- Status updates
- Webhook handling

### 9.2 Integration Patterns

**Service Abstraction:**
- External APIs abstracted in service layer
- Easy to swap providers
- Centralized error handling

**Async Processing:**
- Webhooks processed asynchronously
- SMS/WhatsApp sent asynchronously
- Non-blocking order processing

---

## 10. Deployment Architecture

### 10.1 Current Deployment (Development)

```
┌─────────────────┐
│  Development    │
│  Environment    │
│                 │
│  Frontend:      │
│  localhost:3000 │
│                 │
│  Backend:       │
│  localhost:5000 │
│                 │
│  Database:      │
│  Local PG       │
└─────────────────┘
```

### 10.2 Production Deployment (Recommended)

```
┌─────────────────────────────────────────┐
│         Production Environment          │
│                                         │
│  ┌──────────────┐  ┌──────────────┐   │
│  │   Frontend   │  │   Backend    │   │
│  │   (Vercel/   │  │   (Railway/  │   │
│  │   Netlify)   │  │   Heroku)     │   │
│  └──────┬───────┘  └──────┬───────┘   │
│         │                 │            │
│         └────────┬────────┘            │
│                  │                     │
│         ┌────────▼────────┐            │
│         │   PostgreSQL    │            │
│         │   (Managed DB)  │            │
│         └─────────────────┘            │
└─────────────────────────────────────────┘
```

### 10.3 Environment Configuration

**Backend Environment Variables:**
```env
NODE_ENV=production
PORT=5000
DB_HOST=...
DB_PORT=5432
DB_NAME=...
DB_USER=...
DB_PASSWORD=...
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
FRONTEND_URL=https://...
WEBHOOK_SECRET=...
```

**Frontend Environment Variables:**
```env
NEXT_PUBLIC_API_URL=https://...
NEXT_PUBLIC_RAZORPAY_KEY_ID=...
```

### 10.4 Build Process

**Frontend:**
```bash
npm run build  # Next.js production build
npm start      # Start production server
```

**Backend:**
```bash
npm start      # Start with Node.js
# Or use PM2 for process management
```

---

## 11. Scalability & Performance

### 11.1 Current Scalability

**Limitations:**
- Single server instance
- No load balancing
- No caching layer
- Database connection pooling (basic)

### 11.2 Scalability Strategies

#### 11.2.1 Horizontal Scaling

**Frontend:**
- Stateless Next.js app
- Can deploy multiple instances
- CDN for static assets

**Backend:**
- Stateless API design
- Can deploy multiple instances
- Load balancer required

**Database:**
- PostgreSQL with read replicas
- Connection pooling (pg-pool)

#### 11.2.2 Caching Strategy

**Recommended:**
- Redis for session storage (future)
- API response caching
- Product catalog caching
- CDN for static assets

#### 11.2.3 Database Optimization

**Current:**
- Indexes on frequently queried columns
- Connection pooling

**Future:**
- Query optimization
- Database partitioning (if needed)
- Read replicas for read-heavy operations

### 11.3 Performance Optimization

**Frontend:**
- Code splitting (Next.js automatic)
- Image optimization (Next.js Image)
- Lazy loading
- Bundle size optimization

**Backend:**
- Async processing for non-critical operations
- Database query optimization
- Response compression (gzip)

---

## 12. Error Handling & Resilience

### 12.1 Error Handling Strategy

#### 12.1.1 Backend Error Handling

**Centralized Error Handler:**
```javascript
// middleware/errorHandler.js
- Catches all errors
- Logs errors
- Returns consistent error format
- Handles different error types
```

**Error Types:**
- Validation errors (400)
- Not found errors (404)
- Authentication errors (401)
- Server errors (500)

#### 12.1.2 Frontend Error Handling

**Error Boundaries:**
- React error boundaries (future)
- Try-catch blocks for API calls
- User-friendly error messages

**Error Display:**
- Toast notifications
- Inline error messages
- Error pages for critical failures

### 12.2 Resilience Patterns

#### 12.2.1 Payment Resilience

**Idempotency:**
- Webhook processing checks order status
- Prevents duplicate processing
- Order status transitions are atomic

**Retry Logic:**
- Payment verification retries (future)
- Webhook retry handling

#### 12.2.2 External Service Resilience

**SMS/WhatsApp:**
- Failures don't block order processing
- Errors logged for manual retry
- Graceful degradation

**Cloudinary:**
- Fallback to default image on failure
- Error logging

#### 12.2.3 Database Resilience

**Connection Pooling:**
- Handles connection failures
- Automatic reconnection
- Connection limits

**Transaction Management:**
- Atomic inventory updates
- Rollback on errors
- Data consistency

---

## 13. Monitoring & Logging

### 13.1 Current Logging

**Backend:**
- Console logging
- Error logging
- Payment event logging

**Frontend:**
- Console logging (development)
- Error logging

### 13.2 Recommended Monitoring

**Application Monitoring:**
- Error tracking (Sentry, Rollbar)
- Performance monitoring (New Relic, Datadog)
- Uptime monitoring

**Logging:**
- Structured logging (Winston, Pino)
- Log aggregation (ELK Stack, CloudWatch)
- Log levels (error, warn, info, debug)

**Metrics:**
- API response times
- Error rates
- Order processing times
- Payment success rates

### 13.3 Health Checks

**Endpoint:** `GET /health`

**Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Future Enhancements:**
- Database connection check
- External service health checks
- Detailed system metrics

---

## 14. Future Architecture Enhancements

### 14.1 Short-Term (3-6 months)

1. **Authentication & Authorization**
   - JWT-based authentication
   - Role-based access control (Admin, Customer)
   - Protected admin routes

2. **User Accounts**
   - User registration/login
   - Order history for users
   - Saved addresses

3. **Caching Layer**
   - Redis for session storage
   - API response caching
   - Product catalog caching

4. **Enhanced Monitoring**
   - Error tracking service
   - Performance monitoring
   - Analytics dashboard

### 14.2 Medium-Term (6-12 months)

1. **Microservices Architecture**
   - Separate services for orders, products, payments
   - API Gateway
   - Service communication (message queue)

2. **Real-Time Features**
   - WebSocket for order updates
   - Real-time inventory updates
   - Live order tracking

3. **Advanced Features**
   - Product reviews and ratings
   - Wishlist functionality
   - Recommendation engine
   - Email notifications

### 14.3 Long-Term (12+ months)

1. **Multi-Vendor Support**
   - Vendor management
   - Multi-vendor orders
   - Vendor dashboards

2. **Mobile Apps**
   - React Native app
   - Push notifications
   - Offline support

3. **Advanced Analytics**
   - Business intelligence
   - Sales analytics
   - Customer analytics

---

## Appendix A: Technology Versions

**Frontend:**
- Next.js: 14.0.4
- React: 18.2.0
- TypeScript: 5.3.3
- Tailwind CSS: 3.3.6
- Axios: 1.6.2
- Razorpay: 2.9.6

**Backend:**
- Node.js: 18+
- Express: 4.18.2
- PostgreSQL: 12+
- Razorpay: 2.9.2
- Twilio: 4.19.0
- Cloudinary: 2.8.0

## Appendix B: Database Schema Diagram

```
┌──────────────┐
│   products   │
├──────────────┤
│ id (PK)      │
│ name         │
│ description  │
│ price        │
│ unit         │
│ unit_value   │
│ image        │
│ category     │
│ status       │
└──────┬───────┘
       │
       │ 1:N
       │
┌──────▼──────────┐
│ product_variant │
├─────────────────┤
│ variant_id (PK) │
│ product_id (FK) │
│ variant_name    │
│ variant_weight  │
│ variant_price   │
│ is_default      │
│ is_active       │
└─────────────────┘

┌──────────────┐
│   products   │
├──────────────┤
│ id (PK)      │
└──────┬───────┘
       │
       │ 1:1
       │
┌──────▼──────────────┐
│ product_inventory   │
├─────────────────────┤
│ inventory_id (PK)   │
│ product_id (FK, UK) │
│ available_quantity  │
└─────────────────────┘

┌──────────────┐
│    orders    │
├──────────────┤
│ id (PK)      │
│ customer_name│
│ customer_phone│
│ delivery_address│
│ cart_items (JSONB)│
│ amount       │
│ payment_mode │
│ razorpay_*   │
│ status       │
└──────────────┘
```

## Appendix C: API Response Examples

### Success Response
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Gulab Jamun",
    "price": 150.00
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Product not found"
}
```

### Validation Error Response
```json
{
  "success": false,
  "error": "Validation failed",
  "errors": [
    {
      "field": "customerName",
      "message": "Name is required"
    }
  ]
}
```

---

**Document End**



