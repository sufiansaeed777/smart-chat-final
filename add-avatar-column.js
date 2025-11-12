const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function addAvatarColumn() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connecting to database...');
    await client.connect();

    console.log('Adding avatar column to users table...');
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT NULL');

    console.log('✅ Avatar column added successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

addAvatarColumn();
