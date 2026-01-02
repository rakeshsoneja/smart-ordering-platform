-- Seed Products
-- Insert the original products that were previously hardcoded

INSERT INTO products (name, description, price, unit, unit_value, image, category, status) VALUES
('Gulab Jamun', 'Soft and sweet milk dumplings in sugar syrup', 250.00, 'pc', 1, '🍩', 'sweet', 'active'),
('Rasgulla', 'Spongy cottage cheese balls in light syrup', 200.00, 'pc', 1, '🍡', 'sweet', 'active'),
('Jalebi', 'Crispy orange swirls soaked in sugar syrup', 200.00, 'gms', 250, '🌀', 'sweet', 'active'),
('Kaju Katli', 'Diamond-shaped cashew fudge', 400.00, 'gms', 250, '💎', 'sweet', 'active'),
('Samosa', 'Crispy fried pastry with spiced potato filling', 30.00, 'pc', 1, '🥟', 'savory', 'active'),
('Kachori', 'Deep-fried pastry with lentil filling', 25.00, 'pc', 1, '🥯', 'savory', 'active')
ON CONFLICT DO NOTHING;

