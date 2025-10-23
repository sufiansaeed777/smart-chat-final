require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function findBot() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database');

    const result = await client.query(
      "SELECT id, name, training_status FROM bots WHERE LOWER(name) LIKE '%test123%'"
    );

    if (result.rows.length > 0) {
      console.log('\nFound bot:');
      result.rows.forEach(bot => {
        console.log('Name:', bot.name);
        console.log('ID:', bot.id);
        console.log('Training Status:', bot.training_status);
      });
    } else {
      console.log('\nNo bot found with name containing "test123"');
      console.log('\nAll bots:');
      const all = await client.query('SELECT id, name, training_status FROM bots');
      all.rows.forEach(bot => {
        console.log('- ' + bot.name + ' (Status: ' + bot.training_status + ')');
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

findBot();
