require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function verify() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    const result = await client.query(
      "SELECT id, name, training_status, last_trained_at FROM bots WHERE LOWER(name) = 'test123'"
    );

    if (result.rows.length === 0) {
      console.log('Test123 not found!');
      return;
    }

    const bot = result.rows[0];
    console.log('Bot: Test123');
    console.log('ID:', bot.id);
    console.log('Training Status:', bot.training_status);
    console.log('Last Trained:', bot.last_trained_at);

    if (bot.training_status !== 'trained') {
      console.log('\nUPDATING to trained...');
      await client.query(
        "UPDATE bots SET training_status = 'trained', last_trained_at = NOW() WHERE id = $1",
        [bot.id]
      );
      console.log('UPDATED successfully!');
    } else {
      console.log('\nAlready trained!');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

verify();
