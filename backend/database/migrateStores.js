const { query } = require('./dbConnection');

/**
 * Ensure `stores` exists and a default row is present (idempotent).
 * Aligns with migrateStores.sql for manual runs.
 */
const migrateStores = async () => {
  try {
    console.log('🔄 Ensuring stores table and default row...');

    await query(`
      CREATE TABLE IF NOT EXISTS stores (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        logo_url TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await query(`
      INSERT INTO stores (name, logo_url)
      SELECT 'Default Store', ''
      WHERE NOT EXISTS (SELECT 1 FROM stores)
    `);

    console.log('✅ Stores migration completed');
  } catch (error) {
    console.error('❌ Error during stores migration:', error);
    throw error;
  }
};

module.exports = migrateStores;
