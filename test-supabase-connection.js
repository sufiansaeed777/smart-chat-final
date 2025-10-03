require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase Database Connection...\n');

  // Display connection info (masked)
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ DATABASE_URL not found in environment variables');
    process.exit(1);
  }

  // Parse connection string
  const urlParts = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (urlParts) {
    console.log('📊 Connection Details:');
    console.log(`   Host: ${urlParts[3]}`);
    console.log(`   Port: ${urlParts[4]}`);
    console.log(`   Database: ${urlParts[5]}`);
    console.log(`   User: ${urlParts[1]}`);
    console.log(`   Password: ${urlParts[2].substring(0, 4)}****\n`);
  }

  // Create connection pool
  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Test 1: Basic connection
    console.log('1️⃣ Testing basic connection...');
    const client = await pool.connect();
    console.log('✅ Connected successfully!\n');

    // Test 2: Query database version
    console.log('2️⃣ Checking PostgreSQL version...');
    const versionResult = await client.query('SELECT version()');
    console.log(`✅ PostgreSQL: ${versionResult.rows[0].version.split(',')[0]}\n`);

    // Test 3: List existing tables
    console.log('3️⃣ Checking existing tables...');
    const tablesQuery = `
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `;
    const tablesResult = await client.query(tablesQuery);

    if (tablesResult.rows.length > 0) {
      console.log('✅ Found tables:');
      tablesResult.rows.forEach(row => {
        console.log(`   - ${row.tablename}`);
      });
    } else {
      console.log('⚠️  No tables found in public schema');
    }
    console.log();

    // Test 4: Check for TypeORM specific tables
    console.log('4️⃣ Checking for application tables...');
    const appTables = ['user', 'bot', 'subscription', 'conversation', 'billing_plan', 'invoice', 'bot_assignment', 'chatbot_issue'];
    const existingAppTables = [];

    for (const table of appTables) {
      const result = await client.query(
        "SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = $1)",
        [table]
      );
      if (result.rows[0].exists) {
        existingAppTables.push(table);
      }
    }

    if (existingAppTables.length > 0) {
      console.log('✅ Application tables found:');
      existingAppTables.forEach(table => {
        console.log(`   - ${table}`);
      });
    } else {
      console.log('⚠️  No application tables found. You may need to run migrations.');
    }
    console.log();

    // Test 5: Check connection pooling
    console.log('5️⃣ Testing connection pool...');
    const poolStatus = {
      total: pool.totalCount,
      idle: pool.idleCount,
      waiting: pool.waitingCount
    };
    console.log(`✅ Pool status: Total: ${poolStatus.total}, Idle: ${poolStatus.idle}, Waiting: ${poolStatus.waiting}\n`);

    // Release the client
    client.release();

    console.log('🎉 All database connection tests passed successfully!');
    console.log('\n📌 Next steps:');
    if (existingAppTables.length === 0) {
      console.log('   1. Run migrations: npm run migration:run');
      console.log('   2. Or sync schema: npm run schema:sync');
    } else {
      console.log('   - Your database is ready to use!');
    }

  } catch (error) {
    console.error('❌ Database connection failed!');
    console.error('Error:', error.message);

    if (error.code === 'ENOTFOUND') {
      console.error('\n⚠️  Could not resolve host. Check your internet connection and Supabase URL.');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n⚠️  Connection refused. Check if your Supabase project is active.');
    } else if (error.message.includes('password')) {
      console.error('\n⚠️  Authentication failed. Check your database credentials.');
    }

    process.exit(1);
  } finally {
    // Close the pool
    await pool.end();
  }
}

testSupabaseConnection();