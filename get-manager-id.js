const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Disable SSL verification for development
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function getManagerInfo() {
  try {
    console.log('Fetching manager user info...\n');

    // Get the manager user
    const userResult = await pool.query(
      `SELECT id, email, "firstName", "lastName", role
       FROM users
       WHERE email = $1`,
      ['manager@manager.com']
    );

    if (userResult.rows.length > 0) {
      const manager = userResult.rows[0];
      console.log('Manager User Found:');
      console.log('ID:', manager.id);
      console.log('Email:', manager.email);
      console.log('Name:', manager.firstName, manager.lastName);
      console.log('Role:', manager.role);
      console.log('');

      // Get manager's bots
      const botsResult = await pool.query(
        `SELECT id, name, status, model
         FROM bots
         WHERE "createdBy" = $1`,
        [manager.id]
      );

      console.log('Manager\'s Bots:');
      if (botsResult.rows.length > 0) {
        botsResult.rows.forEach(bot => {
          console.log(`- Bot ID: ${bot.id}`);
          console.log(`  Name: ${bot.name}`);
          console.log(`  Status: ${bot.status}`);
          console.log(`  Model: ${bot.model}`);

          // Generate correct token
          const token = `${manager.id}:${bot.id}:test_token_123`;
          console.log(`  Token: ${token}`);
          console.log('');
        });
      } else {
        console.log('No bots found for manager');
      }
    } else {
      console.log('Manager user not found');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

getManagerInfo();