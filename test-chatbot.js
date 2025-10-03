const fetch = require('node-fetch');

// Test the chatbot API directly
async function testChatbot() {
  console.log('🤖 Testing Chatbot System...\n');

  // Your test token from earlier
  const token = '8a1ea0cc-651e-45da-8f14-5440f63c9b99:b94cda28-f61d-4029-b200-3cc067a488ce:wp_qa11hsg83c9wq4f31h3zq';
  const apiUrl = 'http://localhost:3000';

  try {
    // Step 1: Validate token
    console.log('1️⃣ Validating token...');
    const validateResponse = await fetch(`${apiUrl}/api/wordpress/validate-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: token,
        domain: 'test.local'
      })
    });

    const validateData = await validateResponse.json();

    if (!validateData.valid) {
      console.log('❌ Token validation failed:', validateData.error);
      return;
    }

    console.log('✅ Token is valid!');
    console.log('   Bot Name:', validateData.bot.name);
    console.log('   Welcome Message:', validateData.bot.welcomeMessage);
    console.log('   Model:', validateData.bot.model);
    console.log('');

    // Step 2: Send a test message
    console.log('2️⃣ Sending test message...');
    const messageResponse = await fetch(`${apiUrl}/api/wordpress/send-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: token,
        domain: 'test.local',
        message: 'Hello, what can you do?',
        sessionId: 'test-session-123'
      })
    });

    const messageData = await messageResponse.json();

    if (messageData.error) {
      console.log('❌ Message failed:', messageData.error);

      // Check if it's an OpenAI API key issue
      if (messageData.error.includes('API key') || messageData.error.includes('OpenAI')) {
        console.log('\n⚠️  OpenAI API Key Issue Detected!');
        console.log('   Please check your .env.local file');
        console.log('   Make sure OPENAI_API_KEY is set correctly');
      }
      return;
    }

    console.log('✅ Bot responded!');
    console.log('   Response:', messageData.response);
    console.log('');

    console.log('🎉 Chatbot system is working correctly!');

  } catch (error) {
    console.error('❌ Error testing chatbot:', error.message);

    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n⚠️  Make sure your Next.js app is running (npm run dev)');
    }
  }
}

// Check if fetch is available
if (!global.fetch) {
  global.fetch = require('node-fetch');
}

testChatbot();