require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function checkTokens() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database\n');

    const bot = await client.query(
      "SELECT id, name, \"createdBy\" FROM bots WHERE LOWER(name) = 'test123'"
    );

    if (bot.rows.length === 0) {
      console.log('Bot Test123 not found!');
      return;
    }

    const botData = bot.rows[0];
    console.log('Bot Found:');
    console.log('- Name:', botData.name);
    console.log('- ID:', botData.id);
    console.log('- Created By User:', botData.createdBy);

    const tokens = await client.query(
      'SELECT token, is_active, created_at, last_used FROM wordpress_tokens WHERE bot_id = $1',
      [botData.id]
    );

    console.log('\nWordPress Tokens for Test123:');
    if (tokens.rows.length === 0) {
      console.log('NO TOKENS FOUND! Generate one in Integrations page.');
    } else {
      tokens.rows.forEach((t) => {
        console.log('\nToken:', t.token);
        console.log('Active:', t.is_active);
        console.log('Created:', t.created_at);
        console.log('Last Used:', t.last_used || 'Never');
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkTokens();
