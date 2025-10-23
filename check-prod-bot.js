const { Client } = require('pg');

async function checkProdBot() {
  const client = new Client({
    connectionString: "postgresql://postgres.aucvnpwyrbefzfiqnrvd:DT5X7gFAThRZNzNc@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to PRODUCTION database\n');

    const result = await client.query(
      "SELECT id, name, training_status FROM bots WHERE name = 'Test123'"
    );

    if (result.rows.length > 0) {
      const bot = result.rows[0];
      console.log('Bot: Test123');
      console.log('ID:', bot.id);
      console.log('Training Status:', bot.training_status);
      
      if (bot.training_status !== 'trained') {
        console.log('\nISSUE: Bot is NOT trained!');
        console.log('This is why n8n is not being called.');
      } else {
        console.log('\nBot IS marked as trained - n8n should be called');
      }
    } else {
      console.log('Bot Test123 not found in production database!');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkProdBot();
