/**
 * WordPress API Integration Test
 * Tests the WordPress endpoints without needing WordPress installed
 */

const API_BASE = 'http://localhost:3000';

async function testWordPressAPI() {
  console.log('🧪 Testing WordPress API Integration...\n');

  // Test 1: Validate Token Endpoint
  console.log('Test 1: Validate Token Endpoint');
  console.log('='.repeat(50));

  try {
    const response = await fetch(`${API_BASE}/api/wordpress/validate-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: 'test-token-123',
        domain: 'localhost'
      }),
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (response.status === 400 || response.status === 401) {
      console.log('✅ Endpoint working (rejecting invalid token as expected)');
    } else if (response.ok) {
      console.log('✅ Token validated successfully!');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n');

  // Test 2: Send Message Endpoint (V2)
  console.log('Test 2: Send Message Endpoint (V2)');
  console.log('='.repeat(50));

  try {
    const response = await fetch(`${API_BASE}/api/wordpress/send-message-v2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        botId: 'test-bot-id',
        message: 'Hello from WordPress test',
        userId: 'test-user-123',
        sessionId: 'test-session-456'
      }),
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('✅ Message endpoint working!');
      console.log('Bot Response:', data.response);
    } else if (response.status === 404) {
      console.log('⚠️  Bot not found (expected - using test bot ID)');
      console.log('✅ But endpoint is working!');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n');

  // Test 3: CORS Headers
  console.log('Test 3: CORS Headers Check');
  console.log('='.repeat(50));

  try {
    const response = await fetch(`${API_BASE}/api/wordpress/validate-token`, {
      method: 'OPTIONS',
    });

    const headers = Object.fromEntries(response.headers.entries());
    console.log('CORS Headers:', headers);

    if (headers['access-control-allow-origin']) {
      console.log('✅ CORS enabled for WordPress integration!');
    } else {
      console.log('⚠️  CORS might not be configured');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n');
  console.log('='.repeat(50));
  console.log('🎉 WordPress API Test Complete!');
  console.log('='.repeat(50));
  console.log('\nTo test with actual bot:');
  console.log('1. Get your bot token from dashboard');
  console.log('2. Update token in test-wordpress-with-real-bot.js');
  console.log('3. Run: node test-wordpress-with-real-bot.js');
}

// Run tests
testWordPressAPI().catch(console.error);
