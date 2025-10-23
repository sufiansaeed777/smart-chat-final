require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function checkBotStatus() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    const result = await client.query('SELECT * FROM bots LIMIT 3');

    console.log('\n📋 Bot columns:', Object.keys(result.rows[0] || {}));
    console.log('\n📋 Recent Bots:');
    result.rows.forEach(bot => {
      console.log(`\nBot: ${bot.name}`);
      console.log(`ID: ${bot.id}`);
      console.log(`Training Status: ${bot.trainingStatus}`);
      console.log('---');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkBotStatus();
