// Test script to verify n8n webhook response
const N8N_WEBHOOK_URL = 'https://synofexai.app.n8n.cloud/webhook/c724f29c-cc20-4409-90c2-d4a494ad3e41';

async function testN8nTraining() {
  console.log('🧪 Testing n8n Training Webhook...\n');

  const testPayload = {
    type: 'training',
    botId: 'test-bot-123',
    botName: 'Test Bot',
    documentId: 'test-doc-456',
    documentName: 'test.txt',
    documentContent: 'This is a test document for training.',
    documentType: 'txt',
    action: 'train',
    timestamp: new Date().toISOString()
  };

  console.log('📤 Sending payload:');
  console.log(JSON.stringify(testPayload, null, 2));
  console.log('\n');

  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });

    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
    console.log(`📋 Content-Type: ${response.headers.get('content-type')}`);

    const responseText = await response.text();
    console.log(`📦 Response Body Length: ${responseText.length} bytes`);

    if (responseText) {
      console.log(`📄 Response Body:\n${responseText}`);

      try {
        const json = JSON.parse(responseText);
        console.log('\n✅ Valid JSON Response:');
        console.log(JSON.stringify(json, null, 2));
      } catch (e) {
        console.log('\n⚠️ Response is not valid JSON');
      }
    } else {
      console.log('\n⚠️ EMPTY RESPONSE BODY - This is the issue!');
      console.log('n8n received the request but returned nothing.');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

async function testN8nChat() {
  console.log('\n\n🧪 Testing n8n Chat Webhook...\n');

  const testPayload = {
    chat_id: 'test-chat-123',
    message: 'Hello, this is a test message',
    bot_id: 'test-bot-123'
  };

  console.log('📤 Sending payload:');
  console.log(JSON.stringify(testPayload, null, 2));
  console.log('\n');

  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });

    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
    console.log(`📋 Content-Type: ${response.headers.get('content-type')}`);

    const responseText = await response.text();
    console.log(`📦 Response Body Length: ${responseText.length} bytes`);

    if (responseText) {
      console.log(`📄 Response Body:\n${responseText}`);

      try {
        const json = JSON.parse(responseText);
        console.log('\n✅ Valid JSON Response:');
        console.log(JSON.stringify(json, null, 2));
      } catch (e) {
        console.log('\n⚠️ Response is not valid JSON');
      }
    } else {
      console.log('\n⚠️ EMPTY RESPONSE BODY');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

// Run tests
console.log('========================================');
console.log('   N8N WEBHOOK DIAGNOSTIC TEST');
console.log('========================================\n');

testN8nTraining().then(() => testN8nChat());
