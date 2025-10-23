require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function updateBotTraining() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database');

    const bots = await client.query('SELECT id, name, training_status FROM bots LIMIT 5');
    console.log('\nCurrent bots:');
    bots.rows.forEach((bot, idx) => {
      console.log((idx + 1) + '. ' + bot.name + ' (' + bot.id + ') - Status: ' + bot.training_status);
    });

    const botToUpdate = bots.rows[0];
    if (botToUpdate) {
      await client.query(
        'UPDATE bots SET training_status = $1, last_trained_at = NOW() WHERE id = $2',
        ['trained', botToUpdate.id]
      );
      console.log('\nUpdated "' + botToUpdate.name + '" to training_status = trained');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

updateBotTraining();
