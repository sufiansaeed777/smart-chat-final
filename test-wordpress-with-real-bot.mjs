/**
 * WordPress API Integration Test with Real Bot
 * Tests the WordPress endpoints with your actual bot data
 */

import pg from 'pg';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env.local') });

const { Pool } = pg;
const API_BASE = 'http://localhost:3000';

async function testWithRealBot() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🧪 Testing WordPress API with Real Bot...\n');

    // Get a bot from database
    const botResult = await pool.query(
      `SELECT b.*, u.id as user_id
       FROM bots b
       JOIN users u ON b."createdBy" = u.id
       WHERE b.status = 'active'
       LIMIT 1`
    );

    if (botResult.rows.length === 0) {
      console.log('❌ No active bots found in database');
      console.log('Please create a bot first in the dashboard');
      await pool.end();
      return;
    }

    const bot = botResult.rows[0];
    console.log('✅ Found bot:', bot.name);
    console.log('Bot ID:', bot.id);
    console.log('Domain:', bot.domain);
    console.log('');

    // Create a token (format: user_id:bot_id:secret)
    const token = `${bot.user_id}:${bot.id}:wordpress-test-secret`;
    console.log('Generated Token:', token);
    console.log('');

    // Test 1: Validate Token
    console.log('Test 1: Validate Token with Real Bot');
    console.log('='.repeat(50));

    const validateResponse = await fetch(`${API_BASE}/api/wordpress/validate-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: token,
        domain: bot.domain || 'localhost'
      }),
    });

    const validateData = await validateResponse.json();
    console.log('Status:', validateResponse.status);
    console.log('Response:', JSON.stringify(validateData, null, 2));

    if (validateResponse.ok && validateData.valid) {
      console.log('✅ Token validated successfully!');
      console.log('Bot Config:', validateData.bot);
    } else {
      console.log('❌ Token validation failed:', validateData.error);
    }

    console.log('\n');

    // Test 2: Send Message
    console.log('Test 2: Send Message to Real Bot');
    console.log('='.repeat(50));

    const messageResponse = await fetch(`${API_BASE}/api/wordpress/send-message-v2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        botId: bot.id,
        message: 'Hello! This is a test message from WordPress integration',
        userId: 'wp-test-user-123',
        sessionId: `wp-session-${Date.now()}`
      }),
    });

    const messageData = await messageResponse.json();
    console.log('Status:', messageResponse.status);
    console.log('Response:', JSON.stringify(messageData, null, 2));

    if (messageResponse.ok) {
      console.log('✅ Message sent successfully!');
      console.log('Bot Response:', messageData.response);
    } else {
      console.log('❌ Message failed:', messageData.error);
    }

    console.log('\n');
    console.log('='.repeat(50));
    console.log('🎉 WordPress Integration Test Complete!');
    console.log('='.repeat(50));
    console.log('\n📋 Summary:');
    console.log('- Bot Name:', bot.name);
    console.log('- Token Format: user_id:bot_id:secret');
    console.log('- Validation:', validateResponse.ok ? '✅ Working' : '❌ Failed');
    console.log('- Chat:', messageResponse.ok ? '✅ Working' : '❌ Failed');
    console.log('\n🔑 Use this token in WordPress plugin:');
    console.log(token);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

// Run test
testWithRealBot().catch(console.error);
