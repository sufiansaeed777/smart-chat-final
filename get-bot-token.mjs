import pg from 'pg';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function getBotToken() {
  try {
    const result = await pool.query(`
      SELECT
        b.id as bot_id,
        b.name as bot_name,
        b.domain,
        u.id as user_id,
        u.email
      FROM bots b
      JOIN users u ON b."createdBy" = u.id
      WHERE b.status = 'active'
      ORDER BY b."createdAt" DESC
      LIMIT 5
    `);

    if (result.rows.length === 0) {
      console.log('❌ No active bots found');
      console.log('Please create a bot in the dashboard first');
    } else {
      console.log('📋 Your Active Bots:\n');
      console.log('='.repeat(70));

      result.rows.forEach((bot, index) => {
        const token = `${bot.user_id}:${bot.bot_id}:wordpress-secret`;

        console.log(`\n${index + 1}. ${bot.bot_name}`);
        console.log('-'.repeat(70));
        console.log(`   Bot ID:  ${bot.bot_id}`);
        console.log(`   User ID: ${bot.user_id}`);
        console.log(`   Domain:  ${bot.domain || 'Not set'}`);
        console.log(`   Email:   ${bot.email}`);
        console.log(`\n   🔑 WordPress Token:`);
        console.log(`   ${token}`);
        console.log('');
      });

      console.log('='.repeat(70));
      console.log('\n📝 Quick Test Commands:\n');

      const firstBot = result.rows[0];
      const firstToken = `${firstBot.user_id}:${firstBot.bot_id}:wordpress-secret`;

      console.log('1. Test Validate Token:');
      console.log(`   curl -X POST http://localhost:3000/api/wordpress/validate-token \\`);
      console.log(`     -H "Content-Type: application/json" \\`);
      console.log(`     -d '{"token":"${firstToken}","domain":"localhost"}'`);
      console.log('');

      console.log('2. Test Send Message:');
      console.log(`   curl -X POST http://localhost:3000/api/wordpress/send-message-v2 \\`);
      console.log(`     -H "Content-Type: application/json" \\`);
      console.log(`     -d '{"botId":"${firstBot.bot_id}","message":"Hello!","userId":"test","sessionId":"test"}'`);
      console.log('');
    }

    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    await pool.end();
  }
}

getBotToken();
