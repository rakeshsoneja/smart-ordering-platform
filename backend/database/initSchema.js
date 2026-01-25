const fs = require('fs');
const path = require('path');
const { query } = require('./dbConnection');

/**
 * Initialize Database Schema
 * Reads and executes schema.sql to create tables, indexes, functions, and triggers
 */
const initSchema = async () => {
  try {
    console.log('🔧 Initializing database schema...');

    // Read the schema.sql file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    // Remove comments and split by semicolons
    // Filter out empty statements and comments
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => 
        stmt.length > 0 && 
        !stmt.startsWith('--') && 
        !stmt.toLowerCase().includes('create database')
      );

    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await query(statement);
        } catch (error) {
          // Ignore errors for IF NOT EXISTS statements (tables/indexes already exist)
          if (error.code !== '42P07' && error.code !== '42710') {
            // 42P07 = duplicate_table, 42710 = duplicate_object
            console.warn(`⚠️  Schema statement warning: ${error.message}`);
          }
        }
      }
    }

    console.log('✅ Database schema initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing schema:', error);
    throw error;
  }
};

module.exports = initSchema;

