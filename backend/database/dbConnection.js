const { Pool } = require('pg');
require('dotenv').config();

// Create PostgreSQL connection pool
// Support both DATABASE_URL (Render/production) and individual env vars (local dev)
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // required on Render
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'sweet_shop_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };

const pool = new Pool(poolConfig);

// Validate database connection on startup
if (!process.env.DATABASE_URL && !process.env.DB_PASSWORD) {
  console.warn('⚠️  WARNING: DB_PASSWORD is not set in .env file');
  console.warn('⚠️  Please set DB_PASSWORD in backend/.env file with your PostgreSQL password');
}

// Test database connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

// Helper function to execute queries
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    
    // Provide helpful error messages for common issues
    if (error.code === '28P01') {
      console.error('❌ PostgreSQL authentication failed. Please check:');
      if (process.env.DATABASE_URL) {
        console.error('   1. DATABASE_URL in environment variables is correct');
      } else {
        console.error('   1. DB_PASSWORD in backend/.env file is correct');
        console.error('   2. PostgreSQL user exists and password matches');
      }
      console.error('   3. PostgreSQL service is running');
    } else if (error.code === '3D000') {
      console.error('❌ Database does not exist. Please create the database:');
      if (process.env.DATABASE_URL) {
        console.error('   Check your DATABASE_URL connection string');
      } else {
        console.error('   CREATE DATABASE sweet_shop_db;');
      }
    } else if (error.code === 'ECONNREFUSED') {
      console.error('❌ Cannot connect to PostgreSQL. Please check:');
      console.error('   1. PostgreSQL service is running');
      if (!process.env.DATABASE_URL) {
        console.error('   2. DB_HOST and DB_PORT in .env are correct');
      }
    }
    
    throw error;
  }
};

module.exports = { pool, query };
