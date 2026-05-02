-- Idempotent migration: stores table + default row (manual or reference; runtime uses migrateStores.js)
CREATE TABLE IF NOT EXISTS stores (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO stores (name, logo_url)
SELECT 'Default Store', ''
WHERE NOT EXISTS (SELECT 1 FROM stores);
