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
    let schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    // Remove comment lines (lines starting with --)
    schemaSQL = schemaSQL
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && line.trim() !== '')
      .join('\n');

    // Remove CREATE DATABASE statement if present
    schemaSQL = schemaSQL.replace(/CREATE\s+DATABASE[^;]*;/gi, '');

    // Split by semicolon, but handle PostgreSQL functions with $$ delimiters
    const statements = [];
    let currentStatement = '';
    let inFunction = false;
    let delimiter = null;

    for (let i = 0; i < schemaSQL.length; i++) {
      const char = schemaSQL[i];
      const nextChar = schemaSQL[i + 1];

      // Check for $$ delimiter (start or end of function)
      if (char === '$' && nextChar === '$') {
        if (!inFunction) {
          // Start of function - find the delimiter tag
          let j = i + 2;
          let tag = '';
          while (j < schemaSQL.length && schemaSQL[j] !== '$') {
            tag += schemaSQL[j];
            j++;
          }
          delimiter = `$$${tag}$`;
          inFunction = true;
          currentStatement += delimiter;
          i = j; // Skip past the opening $$
        } else {
          // Check if this is the closing delimiter
          let j = i + 2;
          let tag = '';
          while (j < schemaSQL.length && schemaSQL[j] !== '$') {
            tag += schemaSQL[j];
            j++;
          }
          const closingDelimiter = `$$${tag}$`;
          if (closingDelimiter === delimiter) {
            // End of function
            currentStatement += closingDelimiter;
            inFunction = false;
            delimiter = null;
            i = j; // Skip past the closing $$
          } else {
            currentStatement += char;
          }
        }
      } else if (char === ';' && !inFunction) {
        // End of statement (only if not in function)
        currentStatement = currentStatement.trim();
        if (currentStatement.length > 0) {
          statements.push(currentStatement);
        }
        currentStatement = '';
      } else {
        currentStatement += char;
      }
    }

    // Add any remaining statement
    if (currentStatement.trim().length > 0) {
      statements.push(currentStatement.trim());
    }

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement.length > 0) {
        try {
          await query(statement);
          // Log table creation statements specifically
          if (statement.toUpperCase().includes('CREATE TABLE')) {
            const tableMatch = statement.match(/CREATE TABLE.*?(\w+)/i);
            const tableName = tableMatch ? tableMatch[1] : 'unknown';
            console.log(`✅ Executed statement ${i + 1}/${statements.length} (Created table: ${tableName})`);
          } else {
            console.log(`✅ Executed statement ${i + 1}/${statements.length}`);
          }
        } catch (error) {
          // Ignore errors for IF NOT EXISTS statements (tables/indexes already exist)
          if (error.code === '42P07' || error.code === '42710') {
            // 42P07 = duplicate_table, 42710 = duplicate_object
            const objectType = error.code === '42P07' ? 'table' : 'object';
            console.log(`ℹ️  Statement ${i + 1} already exists (skipped ${objectType})`);
          } else if (error.code === '42P01' && statement.toUpperCase().includes('DROP TRIGGER')) {
            // 42P01 = undefined_table - table doesn't exist, so trigger can't exist either
            console.log(`ℹ️  Statement ${i + 1} skipped (table doesn't exist for trigger)`);
          } else {
            console.error(`❌ Error executing statement ${i + 1}:`, error.message);
            console.error(`Error code: ${error.code}`);
            console.error(`Statement preview: ${statement.substring(0, 200)}...`);
            // Don't throw for CREATE TABLE IF NOT EXISTS - just log
            if (statement.toUpperCase().includes('CREATE TABLE IF NOT EXISTS')) {
              console.log(`⚠️  Continuing despite error (IF NOT EXISTS clause)`);
            } else {
              throw error;
            }
          }
        }
      }
    }

    console.log('✅ Database schema initialized successfully');

    // Run migration to create default variants for existing products
    await migrateProductsToVariants();
  } catch (error) {
    console.error('❌ Error initializing schema:', error);
    throw error;
  }
};

/**
 * Migrate existing products to have default variants
 * This ensures backward compatibility - existing products get a default variant
 */
const migrateProductsToVariants = async () => {
  try {
    console.log('🔄 Migrating existing products to variants...');

    // Check if product_variant table exists
    const checkTable = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'product_variant'
      )
    `);
    
    if (!checkTable.rows[0].exists) {
      console.log('⚠️  product_variant table does not exist. Skipping migration.');
      return;
    }

    // Check if migration already done (any variants exist)
    const checkVariants = await query('SELECT COUNT(*) as count FROM product_variant');
    if (parseInt(checkVariants.rows[0].count) > 0) {
      console.log('ℹ️  Variants already exist. Skipping migration.');
      return;
    }

    // Get all active products that don't have variants yet
    const products = await query(`
      SELECT p.* FROM products p
      WHERE p.status = 'active'
      AND NOT EXISTS (
        SELECT 1 FROM product_variant pv WHERE pv.product_id = p.id
      )
    `);

    if (products.rows.length === 0) {
      console.log('ℹ️  No products to migrate.');
      return;
    }

    // Create default variant for each product
    const { createDefaultVariantForProduct } = require('../models/variantModel');
    
    for (const product of products.rows) {
      try {
        await createDefaultVariantForProduct(product);
        console.log(`✅ Migrated: ${product.name} (Product ID: ${product.id})`);
      } catch (error) {
        console.error(`❌ Error migrating product ${product.id}:`, error.message);
      }
    }

    console.log(`🎉 Successfully migrated ${products.rows.length} products!`);
  } catch (error) {
    console.error('❌ Error during migration:', error);
    // Don't throw - allow server to start even if migration fails
  }
};

module.exports = initSchema;
