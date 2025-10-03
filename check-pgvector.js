require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function checkPgVector() {
  console.log('🔍 Checking pgvector extension...\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();

    // Check if pgvector extension exists
    const extensionCheck = await client.query(`
      SELECT * FROM pg_extension WHERE extname = 'vector';
    `);

    if (extensionCheck.rows.length > 0) {
      console.log('✅ pgvector extension is already installed!');
      console.log('   Version:', extensionCheck.rows[0].extversion);
    } else {
      console.log('❌ pgvector extension NOT installed');
      console.log('\n🔧 Attempting to install pgvector...');

      try {
        await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
        console.log('✅ pgvector extension installed successfully!');
      } catch (err) {
        console.log('❌ Failed to install pgvector extension');
        console.log('   Error:', err.message);
        console.log('\n📋 Manual installation required:');
        console.log('   1. Connect to Supabase dashboard');
        console.log('   2. Go to Database → Extensions');
        console.log('   3. Enable "vector" extension');
        console.log('   Or run this SQL manually:');
        console.log('   CREATE EXTENSION IF NOT EXISTS vector;');
      }
    }

    // Check for existing vector columns
    console.log('\n🔍 Checking for existing vector columns...');
    const vectorColumns = await client.query(`
      SELECT
        table_name,
        column_name,
        data_type,
        udt_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND udt_name = 'vector';
    `);

    if (vectorColumns.rows.length > 0) {
      console.log('✅ Found vector columns:');
      vectorColumns.rows.forEach(col => {
        console.log(`   - ${col.table_name}.${col.column_name}`);
      });
    } else {
      console.log('ℹ️  No vector columns found (this is normal for new setup)');
    }

    client.release();
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkPgVector();
