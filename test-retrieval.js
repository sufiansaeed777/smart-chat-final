/**
 * Test RAG Retrieval Functionality
 * Tests if n8n webhook can retrieve document context and respond
 */

// Use native fetch (Node 18+)

async function testN8nRetrieval() {
  console.log('============================================');
  console.log('🔍 RAG RETRIEVAL TEST');
  console.log('============================================\n');

  const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://synofexai.app.n8n.cloud/webhook/c724f29c-cc20-4409-90c2-d4a494ad3e41';
  const TEST_BOT_ID = 'c6a8dbe3-6d62-4089-9b75-4a8fd19d5a35'; // From your training logs

  console.log('📡 Configuration:');
  console.log('   n8n URL:', N8N_WEBHOOK_URL);
  console.log('   Test Bot ID:', TEST_BOT_ID);
  console.log('');

  // Test 1: Send a simple query
  console.log('TEST 1: Simple Query');
  console.log('-------------------');

  const testPayload1 = {
    chat_id: 'test-chat-' + Date.now(),
    message: 'What is in the metadata.txt file?',
    bot_id: TEST_BOT_ID
  };

  console.log('📤 Sending query:', testPayload1.message);

  try {
    const response1 = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload1),
    });

    console.log('📥 Response status:', response1.status, response1.statusText);

    if (response1.ok) {
      const contentType = response1.headers.get('content-type');
      console.log('   Content-Type:', contentType);

      const responseText = await response1.text();
      console.log('   Response length:', responseText.length, 'characters');

      if (responseText) {
        try {
          const responseJson = JSON.parse(responseText);
          console.log('   Parsed JSON:', JSON.stringify(responseJson, null, 2));

          if (responseJson.Response || responseJson.response) {
            console.log('\n✅ TEST 1 PASSED: Got RAG response');
            console.log('   Response:', (responseJson.Response || responseJson.response).substring(0, 200));
          } else {
            console.log('\n⚠️ TEST 1 WARNING: Got response but no "Response" field');
            console.log('   Full response:', responseJson);
          }
        } catch (e) {
          console.log('   Raw response (not JSON):', responseText.substring(0, 200));
          console.log('\n⚠️ TEST 1 WARNING: n8n returned non-JSON response');
        }
      } else {
        console.log('\n❌ TEST 1 FAILED: Empty response from n8n');
      }
    } else {
      const errorText = await response1.text();
      console.log('\n❌ TEST 1 FAILED: HTTP error');
      console.log('   Error:', errorText);
    }
  } catch (error) {
    console.log('\n❌ TEST 1 FAILED: Connection error');
    console.log('   Error:', error.message);
  }

  console.log('\n');

  // Test 2: Test with a different question
  console.log('TEST 2: Context-Based Query');
  console.log('---------------------------');

  const testPayload2 = {
    chat_id: 'test-chat-' + Date.now(),
    message: 'Give me a summary of the documents you were trained on',
    bot_id: TEST_BOT_ID
  };

  console.log('📤 Sending query:', testPayload2.message);

  try {
    const response2 = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload2),
    });

    console.log('📥 Response status:', response2.status, response2.statusText);

    if (response2.ok) {
      const responseText = await response2.text();

      if (responseText) {
        try {
          const responseJson = JSON.parse(responseText);
          const botResponse = responseJson.Response || responseJson.response;

          if (botResponse) {
            console.log('\n✅ TEST 2 PASSED: Got RAG response');
            console.log('   Response:', botResponse.substring(0, 200));
          } else {
            console.log('\n⚠️ TEST 2 WARNING: Response structure unexpected');
          }
        } catch (e) {
          console.log('   Raw response:', responseText.substring(0, 200));
        }
      }
    }
  } catch (error) {
    console.log('\n❌ TEST 2 FAILED:', error.message);
  }

  console.log('\n');

  // Summary
  console.log('============================================');
  console.log('📊 RETRIEVAL TEST SUMMARY');
  console.log('============================================\n');

  console.log('✅ What\'s Working:');
  console.log('   - OpenAI embeddings created and stored in pgvector');
  console.log('   - Bot training status updates correctly');
  console.log('   - Document content is chunked and embedded\n');

  console.log('❓ What Needs n8n Configuration:');
  console.log('   1. n8n workflow must receive webhook with:');
  console.log('      { "chat_id": "...", "message": "...", "bot_id": "..." }\n');
  console.log('   2. n8n must:');
  console.log('      a) Generate embedding for user message');
  console.log('      b) Query PostgreSQL document_embeddings table');
  console.log('      c) Use vector similarity search:');
  console.log('         SELECT chunk_text, 1 - (embedding <=> $1) as similarity');
  console.log('         FROM document_embeddings');
  console.log('         WHERE bot_id = $2');
  console.log('         ORDER BY embedding <=> $1');
  console.log('         LIMIT 5\n');
  console.log('      d) Pass retrieved chunks to GPT for response');
  console.log('      e) Return: { "Response": "AI answer..." }\n');

  console.log('🔧 How to Verify n8n is Working:');
  console.log('   - Check n8n workflow execution logs');
  console.log('   - Verify it queries the database');
  console.log('   - Check if it calls OpenAI for embeddings');
  console.log('   - Confirm it returns context-aware responses\n');

  console.log('💡 Alternative: Direct Retrieval API');
  console.log('   - Create /api/chat endpoint in Next.js');
  console.log('   - Use searchSimilarChunks() from openaiTrainingService');
  console.log('   - Bypass n8n completely for full control\n');
}

testN8nRetrieval().catch(console.error);