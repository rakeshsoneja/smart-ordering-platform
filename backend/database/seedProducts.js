const { query } = require('./dbConnection');

/**
 * Seed Products Script
 * Inserts the original products that were previously hardcoded
 */

const seedProducts = async () => {
  try {
    console.log('🌱 Seeding products...');

    const products = [
      {
        name: 'Gulab Jamun',
        description: 'Soft and sweet milk dumplings in sugar syrup',
        price: 250.00,
        unit: 'pc',
        unitValue: 1,
        image: '🍩',
        category: 'sweet',
        status: 'active',
      },
      {
        name: 'Rasgulla',
        description: 'Spongy cottage cheese balls in light syrup',
        price: 200.00,
        unit: 'pc',
        unitValue: 1,
        image: '🍡',
        category: 'sweet',
        status: 'active',
      },
      {
        name: 'Jalebi',
        description: 'Crispy orange swirls soaked in sugar syrup',
        price: 200.00,
        unit: 'gms',
        unitValue: 250,
        image: '🌀',
        category: 'sweet',
        status: 'active',
      },
      {
        name: 'Kaju Katli',
        description: 'Diamond-shaped cashew fudge',
        price: 400.00,
        unit: 'gms',
        unitValue: 250,
        image: '💎',
        category: 'sweet',
        status: 'active',
      },
      {
        name: 'Samosa',
        description: 'Crispy fried pastry with spiced potato filling',
        price: 30.00,
        unit: 'pc',
        unitValue: 1,
        image: '🥟',
        category: 'savory',
        status: 'active',
      },
      {
        name: 'Kachori',
        description: 'Deep-fried pastry with lentil filling',
        price: 25.00,
        unit: 'pc',
        unitValue: 1,
        image: '🥯',
        category: 'savory',
        status: 'active',
      },
    ];

    // Check if products table exists
    try {
      await query('SELECT 1 FROM products LIMIT 1');
    } catch (error) {
      if (error.code === '42P01') {
        console.error('❌ Products table does not exist!');
        console.error('   Please run the schema.sql file first to create the table:');
        console.error('   psql -U postgres -d sweet_shop_db -f database/schema.sql');
        throw new Error('Products table does not exist. Please run schema.sql first.');
      }
      throw error;
    }

    // Check if products already exist
    const existingProducts = await query('SELECT COUNT(*) as count FROM products');
    if (parseInt(existingProducts.rows[0].count) > 0) {
      console.log('⚠️  Products already exist. Skipping seed.');
      console.log('   To re-seed, delete existing products first or use the admin panel.');
      return;
    }

    // Insert products
    for (const product of products) {
      const insertQuery = `
        INSERT INTO products (name, description, price, unit, unit_value, image, category, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, name
      `;
      
      const result = await query(insertQuery, [
        product.name,
        product.description,
        product.price,
        product.unit,
        product.unitValue,
        product.image,
        product.category,
        product.status,
      ]);

      console.log(`✅ Inserted: ${result.rows[0].name} (ID: ${result.rows[0].id})`);
    }

    console.log(`\n🎉 Successfully seeded ${products.length} products!`);
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  seedProducts()
    .then(() => {
      console.log('\n✨ Seed completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Seed failed!', error);
      process.exit(1);
    });
}

module.exports = seedProducts;

