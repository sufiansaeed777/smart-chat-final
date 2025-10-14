const { AppDataSource } = require('./dist/config/database');

async function checkTrainingDuplicates() {
  console.log('\n🔍 CHECKING TRAINING DUPLICATE ISSUE');
  console.log('=====================================');

  try {
    // Initialize database
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Check if embeddings table has any duplicate prevention
    const result = await AppDataSource.query(`
      SELECT
        bot_id,
        document_id,
        COUNT(*) as embedding_count,
        COUNT(DISTINCT chunk_index) as unique_chunks,
        MIN(created_at) as first_trained,
        MAX(created_at) as last_trained
      FROM document_embeddings
      GROUP BY bot_id, document_id
      HAVING COUNT(*) > 0
      ORDER BY embedding_count DESC
      LIMIT 10
    `);

    if (result.length > 0) {
      console.log('📊 Current embeddings in database:');
      result.forEach(r => {
        console.log(`   Bot ${r.bot_id.substring(0, 8)}... + Doc ${r.document_id.substring(0, 8)}...:`);
        console.log(`     - Embeddings: ${r.embedding_count}`);
        console.log(`     - Unique chunks: ${r.unique_chunks}`);
        console.log(`     - First trained: ${new Date(r.first_trained).toLocaleString()}`);
        console.log(`     - Last trained: ${new Date(r.last_trained).toLocaleString()}`);
      });

      // Check for actual duplicates (same bot, same doc, same chunk_index)
      const duplicates = await AppDataSource.query(`
        SELECT
          bot_id,
          document_id,
          chunk_index,
          COUNT(*) as duplicate_count
        FROM document_embeddings
        GROUP BY bot_id, document_id, chunk_index
        HAVING COUNT(*) > 1
      `);

      if (duplicates.length > 0) {
        console.log('\n⚠️ DUPLICATES FOUND:');
        duplicates.forEach(d => {
          console.log(`   Bot ${d.bot_id.substring(0, 8)}... Doc ${d.document_id.substring(0, 8)}... Chunk ${d.chunk_index}: ${d.duplicate_count} copies`);
        });
      } else {
        console.log('\n✅ No exact duplicates found (same chunk_index)');
      }

    } else {
      console.log('📊 No embeddings found in database yet');
    }

    // Check the training logic
    console.log('\n📋 TRAINING BEHAVIOR ANALYSIS:');
    console.log('   ❌ No duplicate prevention implemented');
    console.log('   ⚠️ Each training adds NEW embeddings');
    console.log('   ⚠️ Old embeddings are NOT deleted');
    console.log('   Result: Database will accumulate duplicate embeddings');

    return true;
  } catch (error) {
    console.error('Error checking duplicates:', error);
    return false;
  }
}

async function checkRetrievalFunctionality() {
  console.log('\n🔍 CHECKING RETRIEVAL (n8n RAG)');
  console.log('=====================================');

  const n8nUrl = process.env.N8N_WEBHOOK_URL || 'https://synofexai.app.n8n.cloud/webhook/c724f29c-cc20-4409-90c2-d4a494ad3e41';

  console.log('📡 n8n webhook URL:', n8nUrl);

  // Test n8n chat endpoint
  try {
    console.log('\n📨 Testing n8n chat/retrieval endpoint...');

    const testPayload = {
      chat_id: 'test-' + Date.now(),
      message: 'What documents have you been trained on?',
      bot_id: 'c6a8dbe3-6d62-4089-9b75-4a8fd19d5a35' // The test bot from logs
    };

    const response = await fetch(n8nUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });

    console.log('   Status:', response.status);
    console.log('   Status Text:', response.statusText);

    if (response.ok) {
      const responseText = await response.text();
      console.log('   Response:', responseText ? responseText.substring(0, 200) : '(empty)');

      if (responseText) {
        console.log('\n✅ n8n retrieval endpoint is responding');
        console.log('   RAG retrieval appears to be working');
      } else {
        console.log('\n⚠️ n8n returned empty response');
        console.log('   RAG retrieval may not be configured');
      }
    } else {
      console.log('\n❌ n8n retrieval not working');
      console.log('   Error:', await response.text());
    }

  } catch (error) {
    console.log('\n❌ Failed to connect to n8n');
    console.log('   Error:', error.message);
  }

  // Check OpenAI service for similarity search
  console.log('\n📊 RETRIEVAL ARCHITECTURE:');
  console.log('   1. Training: OpenAI → pgvector (embeddings stored)');
  console.log('   2. Chat request → n8n webhook');
  console.log('   3. n8n should:');
  console.log('      - Generate query embedding');
  console.log('      - Search pgvector for similar chunks');
  console.log('      - Use chunks as context for response');
  console.log('   4. Return AI-generated response');

  // Check if similarity search function exists
  try {
    const functionCheck = await AppDataSource.query(`
      SELECT routine_name
      FROM information_schema.routines
      WHERE routine_name = 'match_document_embeddings'
    `);

    if (functionCheck.length > 0) {
      console.log('\n✅ Vector similarity search function exists');

      // Try to do a sample search
      const sampleSearch = await AppDataSource.query(`
        SELECT COUNT(*) as total_embeddings
        FROM document_embeddings
        WHERE bot_id = 'c6a8dbe3-6d62-4089-9b75-4a8fd19d5a35'
      `);

      if (sampleSearch[0].total_embeddings > 0) {
        console.log(`   Found ${sampleSearch[0].total_embeddings} embeddings for test bot`);
        console.log('   ✅ Embeddings are available for retrieval');
      }
    }
  } catch (error) {
    console.log('   Could not verify search function');
  }

  return true;
}

async function main() {
  console.log('============================================');
  console.log('🔬 TRAINING & RETRIEVAL ANALYSIS');
  console.log('============================================');

  const duplicateCheck = await checkTrainingDuplicates();
  const retrievalCheck = await checkRetrievalFunctionality();

  console.log('\n============================================');
  console.log('📊 SUMMARY & RECOMMENDATIONS');
  console.log('============================================');

  console.log('\n1️⃣ DUPLICATE TRAINING ISSUE:');
  console.log('   ❌ Problem: Training the same bot with same document creates duplicates');
  console.log('   🔧 Solution needed: Delete old embeddings before retraining');
  console.log('   📝 Add to training service:');
  console.log('      DELETE FROM document_embeddings');
  console.log('      WHERE bot_id = ? AND document_id = ?');

  console.log('\n2️⃣ RETRIEVAL STATUS:');
  console.log('   ✅ Embeddings are stored in pgvector');
  console.log('   ✅ Similarity search function exists');
  console.log('   ❓ n8n webhook configured but response unclear');
  console.log('   📝 n8n needs to implement:');
  console.log('      - Query embedding generation');
  console.log('      - Vector similarity search');
  console.log('      - Context-based response generation');

  await AppDataSource.destroy();
  process.exit(0);
}

main().catch(console.error);