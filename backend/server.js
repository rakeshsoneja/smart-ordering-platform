const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const errorHandler = require('./middleware/errorHandler');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const productRoutes = require('./routes/productRoutes');
const adminProductRoutes = require('./routes/adminProductRoutes');
const adminOrderRoutes = require('./routes/adminOrderRoutes');
const adminDeliveryRoutes = require('./routes/adminDeliveryRoutes');
const variantRoutes = require('./routes/variantRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
// WhatsApp integration commented out - using SMS only
// const whatsAppWebhook = require('./whatsapp/whatsAppWebhook');
const initSchema = require('./database/initSchema');
const seedProducts = require('./database/seedProducts');

/**
 * Express Server Setup
 * Main entry point for the backend API
 */

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware - CORS configuration
// In development, allow all origins for mobile testing
// In production, use specific FRONTEND_URL
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? (process.env.FRONTEND_URL || 'http://localhost:3000')
    : true, // Allow all origins in development for mobile testing
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// Body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/products', productRoutes);
app.use('/api/admin/products', adminProductRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/admin/delivery-config', adminDeliveryRoutes);
app.use('/api/variants', variantRoutes);
app.use('/api/inventory', inventoryRoutes);

// WhatsApp Webhook Routes - COMMENTED OUT (using SMS only)
// app.use('/', whatsAppWebhook);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Initialize database schema and seed products before starting server
const startServer = async () => {
  try {
    console.log('🔧 Initializing database...');
    await initSchema();
    await seedProducts();
    console.log('✅ Database initialization completed');
    
    // Start server after database is ready
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
      console.log(`🌍 Server accessible at: http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    console.error('⚠️  Server will not start. Please check your database connection.');
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;


