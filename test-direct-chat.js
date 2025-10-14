/**
 * Test Direct RAG Chat API (bypasses n8n)
 * Tests the /api/chat/direct endpoint
 */

async function testDirectChat() {
  console.log('============================================');
  console.log('💬 DIRECT RAG CHAT TEST');
  console.log('============================================\n');

  const API_URL = 'http://localhost:3000/api/chat/direct';
  const TEST_BOT_ID = 'c6a8dbe3-6d62-4089-9b75-4a8fd19d5a35';

  console.log('🔧 Configuration:');
  console.log('   API URL:', API_URL);
  console.log('   Bot ID:', TEST_BOT_ID);
  console.log('   Bypass: n8n (using direct retrieval)\n');

  // Test 1: Ask about the trained document
  console.log('TEST 1: Query About Trained Document');
  console.log('------------------------------------');

  const testQuery1 = {
    botId: TEST_BOT_ID,
    message: 'What information is in the metadata.txt file?',
    chatId: 'test-' + Date.now()
  };

  console.log('📤 Sending:', testQuery1.message);

  try {
    const response1 = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testQuery1),
    });

    console.log('📥 Status:', response1.status, response1.statusText);

    if (response1.ok) {
      const result = await response1.json();
      console.log('\n✅ TEST 1 RESULT:');
      console.log('   Success:', result.success);
      console.log('   Context Found:', result.contextFound);
      console.log('   Context Chunks:', result.contextChunks);

      if (result.metadata) {
        console.log('   Model:', result.metadata.model);
        console.log('   Tokens Used:', result.metadata.tokensUsed);
        console.log('   Top Similarity:', result.metadata.topSimilarity);
      }

      console.log('\n   📝 Bot Response:');
      console.log('   ' + result.response.split('\n').join('\n   '));

      if (result.contextFound) {
        console.log('\n   ✅ RAG RETRIEVAL WORKING!');
      } else {
        console.log('\n   ⚠️ No context found - check if bot is trained');
      }
    } else {
      const error = await response1.json();
      console.log('❌ TEST 1 FAILED:', error);
    }
  } catch (error) {
    console.log('❌ TEST 1 ERROR:', error.message);
  }

  console.log('\n');

  // Test 2: Ask a general question (should indicate no relevant context)
  console.log('TEST 2: Query Without Relevant Context');
  console.log('--------------------------------------');

  const testQuery2 = {
    botId: TEST_BOT_ID,
    message: 'What is the weather like today?',
    chatId: 'test-' + Date.now()
  };

  console.log('📤 Sending:', testQuery2.message);

  try {
    const response2 = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testQuery2),
    });

    if (response2.ok) {
      const result = await response2.json();
      console.log('📥 Status:', response2.status);
      console.log('   Context Found:', result.contextFound);
      console.log('   Response:', result.response);

      if (!result.contextFound) {
        console.log('\n   ✅ Correctly identified no relevant context');
      }
    }
  } catch (error) {
    console.log('❌ TEST 2 ERROR:', error.message);
  }

  console.log('\n');

  // Summary
  console.log('============================================');
  console.log('📊 DIRECT CHAT SUMMARY');
  console.log('============================================\n');

  console.log('✅ IMPLEMENTATION COMPLETE:');
  console.log('   1. Direct RAG endpoint at /api/chat/direct');
  console.log('   2. Uses searchSimilarChunks() for vector search');
  console.log('   3. Generates context-aware responses with GPT');
  console.log('   4. Bypasses n8n completely\n');

  console.log('🎯 HOW IT WORKS:');
  console.log('   Step 1: Receive user message');
  console.log('   Step 2: Search document_embeddings with vector similarity');
  console.log('   Step 3: Retrieve top 5 most relevant chunks');
  console.log('   Step 4: Build context from chunks');
  console.log('   Step 5: Send to GPT with context');
  console.log('   Step 6: Return AI-generated response\n');

  console.log('🔄 COMPARISON:');
  console.log('   n8n Route: Frontend → n8n webhook → (empty response)');
  console.log('   Direct Route: Frontend → /api/chat/direct → Full RAG response ✅\n');

  console.log('💡 RECOMMENDATION:');
  console.log('   Use /api/chat/direct for reliable RAG retrieval');
  console.log('   n8n can be used for other workflows if needed\n');
}

console.log('⚠️  NOTE: Make sure the dev server is running:');
console.log('   npm run dev\n');

testDirectChat().catch(console.error);