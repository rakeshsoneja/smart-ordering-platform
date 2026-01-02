# Database Setup Guide

## Step 1: Create the Products Table

First, you need to run the updated schema to create the products table:

```bash
# Using psql command line
psql -U postgres -d sweet_shop_db -f database/schema.sql

# Or if you're already in psql:
\i database/schema.sql
```

## Step 2: Seed the Products

After the table is created, run the seed script to add the original products:

```bash
# From the backend directory
npm run seed:products

# Or directly with node
node database/seedProducts.js
```

## Alternative: Manual SQL Insert

If you prefer to use SQL directly, you can run:

```sql
INSERT INTO products (name, description, price, unit, unit_value, image, category, status) VALUES
('Gulab Jamun', 'Soft and sweet milk dumplings in sugar syrup', 250.00, 'pc', 1, '🍩', 'sweet', 'active'),
('Rasgulla', 'Spongy cottage cheese balls in light syrup', 200.00, 'pc', 1, '🍡', 'sweet', 'active'),
('Jalebi', 'Crispy orange swirls soaked in sugar syrup', 200.00, 'gms', 250, '🌀', 'sweet', 'active'),
('Kaju Katli', 'Diamond-shaped cashew fudge', 400.00, 'gms', 250, '💎', 'sweet', 'active'),
('Samosa', 'Crispy fried pastry with spiced potato filling', 30.00, 'pc', 1, '🥟', 'savory', 'active'),
('Kachori', 'Deep-fried pastry with lentil filling', 25.00, 'pc', 1, '🥯', 'savory', 'active');
```

## Using Admin Panel

You can also add products manually through the admin panel at `/admin` in your frontend application.

