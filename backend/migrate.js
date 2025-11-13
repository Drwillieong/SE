const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrateTimers() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
  });

  try {
    console.log('Migrating timer fields to separate order_timers table...');

    // Create order_timers table if it doesn't exist
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS order_timers (
        timer_id INT AUTO_INCREMENT PRIMARY KEY,
        service_orders_id INT NOT NULL,
        timer_start DATETIME DEFAULT NULL,
        timer_end DATETIME DEFAULT NULL,
        auto_advance_enabled TINYINT(1) DEFAULT 0,
        current_timer_status VARCHAR(20) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (service_orders_id) REFERENCES service_orders(service_orders_id) ON DELETE CASCADE,
        KEY idx_service_orders_id (service_orders_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    await connection.execute(createTableQuery);
    console.log('✅ Created order_timers table');

    // Migrate existing timer data from service_orders to order_timers
    const migrateDataQuery = `
      INSERT INTO order_timers (service_orders_id, timer_start, timer_end, auto_advance_enabled, current_timer_status)
      SELECT service_orders_id, timer_start, timer_end, auto_advance_enabled, current_timer_status
      FROM service_orders
      WHERE timer_start IS NOT NULL OR timer_end IS NOT NULL OR auto_advance_enabled = 1 OR current_timer_status IS NOT NULL;
    `;
    await connection.execute(migrateDataQuery);
    console.log('✅ Migrated existing timer data');

    // Drop timer columns from service_orders
    const dropColumnsQueries = [
      "ALTER TABLE service_orders DROP COLUMN IF EXISTS timer_start",
      "ALTER TABLE service_orders DROP COLUMN IF EXISTS timer_end",
      "ALTER TABLE service_orders DROP COLUMN IF EXISTS auto_advance_enabled",
      "ALTER TABLE service_orders DROP COLUMN IF EXISTS current_timer_status"
    ];

    for (const query of dropColumnsQueries) {
      await connection.execute(query);
      console.log('✅ Dropped timer column');
    }

    console.log('🎉 Timer migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration error:', error.message);
  } finally {
    await connection.end();
  }
}

async function fixBooking() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
  });

  try {
    console.log('Adding missing payment columns to service_orders table...');

    // Add payment columns if they don't exist
    const alterQueries = [
      // Removed redundant payment fields from service_orders - now handled by payments table
      "ALTER TABLE service_orders DROP COLUMN IF EXISTS payment_method",
      "ALTER TABLE service_orders DROP COLUMN IF EXISTS payment_status",
      "ALTER TABLE service_orders DROP COLUMN IF EXISTS payment_proof",
      "ALTER TABLE service_orders DROP COLUMN IF EXISTS reference_id",
      "ALTER TABLE service_orders DROP COLUMN IF EXISTS payment_review_status"
    ];

    for (const query of alterQueries) {
      await connection.execute(query);
      console.log('✅ Added column');
    }

    console.log('🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration error:', error.message);
  } finally {
    await connection.end();
  }
}

// Run migrations
async function runMigrations() {
  await migrateTimers();
  await fixBooking();
}

runMigrations();
