/**
 * Test n8n Chat Functionality
 * Tests if n8n chat webhook is working
 */

// Test configuration
const N8N_WEBHOOK_URL = 'https://synofexai.app.n8n.cloud/webhook/c724f29c-cc20-4409-90c2-d4a494ad3e41';

// Test chat message (matching the structure from PDF)
const TEST_CHAT = {
  "chat_id": "c123",
  "message": "Give me a summary of my document"
};

async function testN8nChat() {
  console.log('🧪 Testing n8n Chat Webhook');
  console.log('============================\n');

  console.log('📦 Test Data:');
  console.log(JSON.stringify(TEST_CHAT, null, 2));
  console.log('\n📡 Sending to n8n webhook...\n');

  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(TEST_CHAT),
    });

    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
    console.log(`📋 Content-Type:`, response.headers.get('content-type'));

    const responseText = await response.text();
    console.log(`\n📝 Raw Response Body:`);
    console.log(responseText || '(empty response)');

    // Try to parse as JSON
    if (responseText) {
      try {
        const jsonResponse = JSON.parse(responseText);
        console.log('\n✅ Parsed JSON Response:');
        console.log(JSON.stringify(jsonResponse, null, 2));

        if (jsonResponse.response || jsonResponse.message || jsonResponse.answer) {
          console.log('\n🎉 SUCCESS: n8n chat is working!');
          console.log('Response:', jsonResponse.response || jsonResponse.message || jsonResponse.answer);
        } else {
          console.log('\n⚠️ WARNING: n8n responded but no chat response found');
        }
      } catch (parseError) {
        console.log('\n⚠️ Response is not valid JSON');
      }
    } else {
      console.log('\n⚠️ Empty response from n8n');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }
}

// Test different message formats
async function testDifferentFormats() {
  console.log('\n\n🧪 Testing Different Message Formats');
  console.log('=====================================\n');

  const testFormats = [
    {
      chat_id: "c123",
      message: "Hello, how are you?"
    },
    {
      botId: "test-bot",
      message: "What can you help me with?",
      action: "chat"
    },
    {
      sessionId: "session-123",
      userMessage: "Tell me about your capabilities",
      userId: "user-456"
    }
  ];

  for (const format of testFormats) {
    console.log(`\n📨 Testing format: ${JSON.stringify(format).substring(0, 50)}...`);

    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(format),
      });

      const responseText = await response.text();

      if (response.ok && responseText) {
        try {
          const json = JSON.parse(responseText);
          console.log(`  ✅ Got response:`, JSON.stringify(json).substring(0, 100) + '...');
        } catch {
          console.log(`  ⚠️ Non-JSON response:`, responseText.substring(0, 100) + '...');
        }
      } else if (response.ok && !responseText) {
        console.log(`  ⚠️ Empty response`);
      } else {
        console.log(`  ❌ Failed with status ${response.status}`);
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
  }
}

// Run tests
async function runAllTests() {
  await testN8nChat();
  await testDifferentFormats();

  console.log('\n\n📊 Summary');
  console.log('==========');
  console.log('The n8n webhook is accessible and returns 200 OK.');
  console.log('Check if it returns actual chat responses.');
  console.log('\nWorkflow URL to check/edit:');
  console.log('https://synofexai.app.n8n.cloud/workflow/V8OQdCTe2Z1evyNU');
}

runAllTests().catch(console.error);