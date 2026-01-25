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
          console.log(`✅ Executed statement ${i + 1}/${statements.length}`);
        } catch (error) {
          // Ignore errors for IF NOT EXISTS statements (tables/indexes already exist)
          if (error.code === '42P07' || error.code === '42710') {
            // 42P07 = duplicate_table, 42710 = duplicate_object
            console.log(`ℹ️  Statement ${i + 1} already exists (skipped)`);
          } else {
            console.error(`❌ Error executing statement ${i + 1}:`, error.message);
            console.error(`Statement: ${statement.substring(0, 100)}...`);
            throw error;
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
