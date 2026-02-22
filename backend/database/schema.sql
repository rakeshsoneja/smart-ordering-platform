-- Create database (run this manually in PostgreSQL)
-- CREATE DATABASE sweet_shop_db;

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
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

-- Create index on razorpay_order_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_razorpay_order_id ON orders(razorpay_order_id);

-- Create index on customer_phone for order history queries
CREATE INDEX IF NOT EXISTS idx_customer_phone ON orders(customer_phone);

-- Create index on status for filtering orders
CREATE INDEX IF NOT EXISTS idx_order_status ON orders(status);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(10) NOT NULL CHECK (unit IN ('pc', 'gms')),
    unit_value INTEGER NOT NULL DEFAULT 1,
    image VARCHAR(255),
    category VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on category for filtering
CREATE INDEX IF NOT EXISTS idx_product_category ON products(category);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_product_status ON products(status);

-- Trigger to automatically update updated_at for products
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Product Variant table (ADDITIVE - does not modify existing products table)
CREATE TABLE IF NOT EXISTS product_variant (
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

-- Create indexes for product_variant
CREATE INDEX IF NOT EXISTS idx_product_variant_product_id ON product_variant(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variant_is_active ON product_variant(is_active);
CREATE INDEX IF NOT EXISTS idx_product_variant_is_default ON product_variant(is_default_variant);

-- Trigger to automatically update updated_at for product_variant
DROP TRIGGER IF EXISTS update_product_variant_updated_at ON product_variant;
CREATE TRIGGER update_product_variant_updated_at BEFORE UPDATE ON product_variant
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Product Inventory table (ADDITIVE - does not modify existing tables)
-- Inventory is maintained at PRODUCT level (not variant level)
-- All variants share the same product inventory
CREATE TABLE IF NOT EXISTS product_inventory (
    inventory_id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
    available_quantity_grams INTEGER NOT NULL DEFAULT 0 CHECK (available_quantity_grams >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for product_inventory
CREATE INDEX IF NOT EXISTS idx_product_inventory_product_id ON product_inventory(product_id);

-- Trigger to automatically update updated_at for product_inventory
DROP TRIGGER IF EXISTS update_product_inventory_updated_at ON product_inventory;
CREATE TRIGGER update_product_inventory_updated_at BEFORE UPDATE ON product_inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Delivery Configuration table (ADDITIVE - does not modify existing tables)
-- Stores weight-based delivery charge configuration
CREATE TABLE IF NOT EXISTS delivery_config (
    config_id SERIAL PRIMARY KEY,
    weight_unit_grams INTEGER NOT NULL CHECK (weight_unit_grams > 0),
    charge_amount DECIMAL(10, 2) NOT NULL CHECK (charge_amount >= 0),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for active delivery config lookups
CREATE INDEX IF NOT EXISTS idx_delivery_config_is_active ON delivery_config(is_active);

-- Trigger to automatically update updated_at for delivery_config
DROP TRIGGER IF EXISTS update_delivery_config_updated_at ON delivery_config;
CREATE TRIGGER update_delivery_config_updated_at BEFORE UPDATE ON delivery_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add nullable delivery charge and total weight columns to orders table (ADDITIVE)
-- These columns are nullable to maintain backward compatibility with existing orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS delivery_charge DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS total_weight_grams INTEGER;




