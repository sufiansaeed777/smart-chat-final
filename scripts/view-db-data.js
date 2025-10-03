const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Disable SSL verification for development
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function viewData() {
  try {
    console.log('=== DATABASE DATA VIEWER ===\n');

    // View Users
    console.log('📋 USERS TABLE:');
    const users = await pool.query('SELECT id, email, "firstName", "lastName", role, "createdAt" FROM users LIMIT 10');
    console.table(users.rows);

    // View Bots
    console.log('\n🤖 BOTS TABLE:');
    const bots = await pool.query('SELECT id, name, status, model, "createdBy", "createdAt" FROM bots LIMIT 10');
    console.table(bots.rows);

    // View WordPress Tokens (if table exists)
    try {
      console.log('\n🔑 WORDPRESS TOKENS TABLE:');
      const tokens = await pool.query('SELECT token, bot_id, user_id, created_at, last_used FROM wordpress_tokens LIMIT 10');
      console.table(tokens.rows);
    } catch (e) {
      console.log('WordPress tokens table not yet created');
    }

    // Show counts
    console.log('\n📊 RECORD COUNTS:');
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    const botCount = await pool.query('SELECT COUNT(*) FROM bots');
    console.log(`Total Users: ${userCount.rows[0].count}`);
    console.log(`Total Bots: ${botCount.rows[0].count}`);

  } catch (error) {
    console.error('Error viewing data:', error);
  } finally {
    await pool.end();
  }
}

// Run if specific table is requested
const table = process.argv[2];
if (table) {
  viewSpecificTable(table);
} else {
  viewData();
}

async function viewSpecificTable(tableName) {
  try {
    console.log(`\n📋 ${tableName.toUpperCase()} TABLE:`);
    const result = await pool.query(`SELECT * FROM ${tableName} LIMIT 20`);
    console.table(result.rows);
    console.log(`\nTotal records: ${result.rowCount}`);
  } catch (error) {
    console.error(`Error viewing table ${tableName}:`, error.message);
  } finally {
    await pool.end();
  }
}