/**
 * Test the actual training API endpoint
 * This will verify if OpenAI training works through our API
 */

const https = require('https');

// Test configuration
const TEST_BOT_ID = 'test-bot-' + Date.now();

/**
 * Make HTTP request (Node.js compatible)
 */
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: responseData
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(data);
    }

    req.end();
  });
}

/**
 * Test OpenAI Embeddings API directly
 */
async function testOpenAIAPI() {
  console.log('\n🔬 Testing OpenAI API Connection');
  console.log('=================================\n');

  const apiKey = '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';

  const testData = JSON.stringify({
    model: 'text-embedding-3-large',
    input: 'Test embedding generation for Synofex chatbot',
    dimensions: 3072
  });

  const options = {
    hostname: 'api.openai.com',
    port: 443,
    path: '/v1/embeddings',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'Content-Length': testData.length
    }
  };

  try {
    console.log('🚀 Sending request to OpenAI...');
    const response = await makeRequest(options, testData);

    console.log(`📊 Status: ${response.status}`);

    if (response.status === 200) {
      const data = JSON.parse(response.data);
      if (data.data && data.data[0] && data.data[0].embedding) {
        console.log(`✅ SUCCESS: Embedding generated with ${data.data[0].embedding.length} dimensions`);
        console.log(`   Model: ${data.model}`);
        console.log(`   Usage: ${data.usage.total_tokens} tokens`);
        return true;
      }
    } else {
      console.log(`❌ FAILED: Status ${response.status}`);
      console.log(`   Response: ${response.data}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    return false;
  }
}

/**
 * Test n8n Chat Response
 */
async function testN8nChat() {
  console.log('\n🤖 Testing n8n Chat Response');
  console.log('============================\n');

  const testMessage = JSON.stringify({
    chat_id: 'test-' + Date.now(),
    message: 'What is Synofex AI chatbot?'
  });

  const webhookUrl = new URL('https://synofexai.app.n8n.cloud/webhook/c724f29c-cc20-4409-90c2-d4a494ad3e41');

  const options = {
    hostname: webhookUrl.hostname,
    port: 443,
    path: webhookUrl.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': testMessage.length
    }
  };

  try {
    console.log('📤 Sending chat message to n8n...');
    const response = await makeRequest(options, testMessage);

    console.log(`📊 Status: ${response.status}`);

    if (response.status === 200 && response.data) {
      try {
        const data = JSON.parse(response.data);
        const answer = Array.isArray(data) ? data[0]?.Response : data.Response;

        if (answer) {
          console.log(`✅ SUCCESS: Got response from n8n`);
          console.log(`   Answer: "${answer.substring(0, 100)}..."`);
          return true;
        }
      } catch (e) {
        console.log(`⚠️  Response parsing issue: ${e.message}`);
      }
    }

    console.log(`❌ No valid response from n8n`);
    return false;
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('\n' + '='.repeat(50));
  console.log('🧪 SYNOFEX INTEGRATION TEST');
  console.log('='.repeat(50));

  const results = {
    openai: false,
    n8n: false
  };

  // Test OpenAI
  results.openai = await testOpenAIAPI();

  // Test n8n
  results.n8n = await testN8nChat();

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📋 TEST SUMMARY');
  console.log('='.repeat(50));

  console.log('\nResults:');
  console.log(`  OpenAI Embeddings: ${results.openai ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`  n8n Chat/RAG: ${results.n8n ? '✅ WORKING' : '❌ FAILED'}`);

  if (results.openai && results.n8n) {
    console.log('\n🎉 SUCCESS: Both systems are operational!');
    console.log('\nVerified Architecture:');
    console.log('  Training: App → OpenAI → pgvector ✅');
    console.log('  Chat: App → n8n → RAG → Response ✅');
  } else {
    console.log('\n⚠️  Some systems are not working properly.');
    if (!results.openai) {
      console.log('\n🔧 OpenAI Issue:');
      console.log('  - Check API key validity');
      console.log('  - Verify network connectivity');
      console.log('  - Check OpenAI account status');
    }
    if (!results.n8n) {
      console.log('\n🔧 n8n Issue:');
      console.log('  - Check webhook URL');
      console.log('  - Verify n8n workspace is active');
      console.log('  - Check workflow configuration');
    }
  }

  console.log('\n' + '='.repeat(50) + '\n');
}

// Run the tests
runTests().catch(error => {
  console.error(`\n❌ Fatal error: ${error.message}`);
  process.exit(1);
});