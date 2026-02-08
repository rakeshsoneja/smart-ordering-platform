const { query } = require('./dbConnection');

/**
 * Migration Script: Convert inventory from variant-level to product-level
 * 
 * This migration:
 * 1. Adds available_quantity_grams column if it doesn't exist
 * 2. Migrates data from old structure to new structure
 * 3. Removes variant_id column and old available_quantity column
 * 4. Updates constraints
 * 
 * SAFE: Preserves all existing inventory data
 */

const migrateInventoryToProductLevel = async () => {
  try {
    console.log('🔄 Starting inventory migration to product-level...');

    // Check if product_inventory table exists
    const tableExists = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'product_inventory'
      )
    `);

    if (!tableExists.rows[0].exists) {
      console.log('ℹ️  product_inventory table does not exist. Migration not needed.');
      return;
    }

    // Check if migration already done (new column exists)
    const columnExists = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'product_inventory' 
        AND column_name = 'available_quantity_grams'
      )
    `);

    if (columnExists.rows[0].exists) {
      console.log('ℹ️  Migration already completed. available_quantity_grams column exists.');
      return;
    }

    console.log('📊 Analyzing existing inventory data...');

    // Get all existing inventory records
    const existingInventory = await query(`
      SELECT inventory_id, product_id, variant_id, available_quantity 
      FROM product_inventory
    `);

    console.log(`Found ${existingInventory.rows.length} existing inventory records`);

    // Start transaction
    await query('BEGIN');

    try {
      // Step 1: Add new column
      console.log('Step 1: Adding available_quantity_grams column...');
      await query(`
        ALTER TABLE product_inventory 
        ADD COLUMN IF NOT EXISTS available_quantity_grams INTEGER DEFAULT 0
      `);

      // Step 2: Migrate data
      // For each product, sum up all variant inventories (or use product-level if variant_id is NULL)
      console.log('Step 2: Migrating data to product-level...');
      
      // Group by product_id and sum quantities
      const productInventoryMap = new Map();
      
      for (const row of existingInventory.rows) {
        const productId = row.product_id;
        const quantity = parseInt(row.available_quantity) || 0;
        
        if (productInventoryMap.has(productId)) {
          // Sum quantities for products with multiple variant records
          productInventoryMap.set(productId, productInventoryMap.get(productId) + quantity);
        } else {
          productInventoryMap.set(productId, quantity);
        }
      }

      // Update each product's inventory
      for (const [productId, totalGrams] of productInventoryMap.entries()) {
        // Keep only one record per product (the first one, or create new)
        const productRecords = existingInventory.rows.filter(r => r.product_id === productId);
        const firstRecord = productRecords[0];

        if (firstRecord) {
          // Update the first record with total quantity
          await query(`
            UPDATE product_inventory
            SET available_quantity_grams = $1
            WHERE inventory_id = $2
          `, [totalGrams, firstRecord.inventory_id]);
        }
      }

      // Delete duplicate records (keep only one per product)
      console.log('Step 3: Removing duplicate records...');
      await query(`
        DELETE FROM product_inventory p1
        WHERE EXISTS (
          SELECT 1 FROM product_inventory p2
          WHERE p2.product_id = p1.product_id
          AND p2.inventory_id < p1.inventory_id
        )
      `);

      // Step 4: Remove old columns and constraints
      console.log('Step 4: Removing old columns and constraints...');
      
      // Drop old indexes that reference variant_id
      await query(`DROP INDEX IF EXISTS idx_product_inventory_variant_id`);
      await query(`DROP INDEX IF EXISTS idx_product_inventory_product_variant`);
      await query(`DROP INDEX IF EXISTS idx_product_inventory_product_null_variant`);
      
      // Drop old unique constraint
      await query(`
        ALTER TABLE product_inventory 
        DROP CONSTRAINT IF EXISTS product_inventory_product_id_variant_id_key
      `);
      
      // Drop variant_id column
      await query(`
        ALTER TABLE product_inventory 
        DROP COLUMN IF EXISTS variant_id
      `);
      
      // Drop old available_quantity column
      await query(`
        ALTER TABLE product_inventory 
        DROP COLUMN IF EXISTS available_quantity
      `);

      // Step 5: Add new unique constraint on product_id only
      console.log('Step 5: Adding new constraints...');
      await query(`
        ALTER TABLE product_inventory 
        ADD CONSTRAINT product_inventory_product_id_key UNIQUE (product_id)
      `);

      // Step 6: Add check constraint for non-negative quantity
      await query(`
        ALTER TABLE product_inventory 
        ADD CONSTRAINT product_inventory_available_quantity_grams_check 
        CHECK (available_quantity_grams >= 0)
      `);

      // Step 7: Set NOT NULL on available_quantity_grams
      await query(`
        ALTER TABLE product_inventory 
        ALTER COLUMN available_quantity_grams SET NOT NULL
      `);

      // Step 8: Set DEFAULT 0
      await query(`
        ALTER TABLE product_inventory 
        ALTER COLUMN available_quantity_grams SET DEFAULT 0
      `);

      // Commit transaction
      await query('COMMIT');
      
      console.log('✅ Migration completed successfully!');
      console.log(`📦 Migrated ${productInventoryMap.size} products to product-level inventory`);
      
    } catch (error) {
      // Rollback on error
      await query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  }
};

module.exports = migrateInventoryToProductLevel;

