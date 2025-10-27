/**
 * Test Script: Prompt Detection and Priority System
 *
 * This script tests the automatic prompt detection and priority system
 * by checking the database embeddings classification.
 *
 * Prerequisites:
 * 1. Run the SQL migration (add_prompt_detection_columns.sql)
 * 2. Train a bot with both prompt and content documents
 * 3. Set your environment variables
 */

require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function testPromptDetection() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Get all bots
    const botsResult = await client.query('SELECT id, name FROM bots ORDER BY created_at DESC LIMIT 5');

    if (botsResult.rows.length === 0) {
      console.log('❌ No bots found. Please create a bot first.');
      return;
    }

    console.log('📋 Available Bots:');
    botsResult.rows.forEach((bot, index) => {
      console.log(`${index + 1}. ${bot.name} (${bot.id})`);
    });
    console.log();

    // Test each bot
    for (const bot of botsResult.rows) {
      console.log(`\n🤖 Testing Bot: ${bot.name} (${bot.id})`);
      console.log('='.repeat(80));

      // Check embeddings classification
      const embeddingsResult = await client.query(`
        SELECT
          document_name,
          is_prompt,
          priority_order,
          COUNT(*) as chunk_count
        FROM document_embeddings
        WHERE bot_id = $1
        GROUP BY document_name, is_prompt, priority_order
        ORDER BY priority_order ASC, document_name ASC
      `, [bot.id]);

      if (embeddingsResult.rows.length === 0) {
        console.log('⚠️  No embeddings found. Bot needs to be trained.\n');
        continue;
      }

      console.log('\n📊 Document Classification:');
      console.log('-'.repeat(80));
      console.log('Document Name'.padEnd(40) + 'Type'.padEnd(15) + 'Priority'.padEnd(10) + 'Chunks');
      console.log('-'.repeat(80));

      let promptCount = 0;
      let contentCount = 0;

      embeddingsResult.rows.forEach((row) => {
        const type = row.is_prompt ? '🎯 PROMPT' : '📄 CONTENT';
        const typeColor = row.is_prompt ? '\x1b[32m' : '\x1b[36m'; // Green for prompt, Cyan for content
        const resetColor = '\x1b[0m';

        console.log(
          row.document_name.substring(0, 38).padEnd(40) +
          `${typeColor}${type}${resetColor}`.padEnd(25) +
          row.priority_order.toString().padEnd(10) +
          row.chunk_count
        );

        if (row.is_prompt) promptCount++;
        else contentCount++;
      });

      console.log('-'.repeat(80));
      console.log(`Total: ${promptCount} prompt document(s), ${contentCount} content document(s)`);

      // Test vector search priority
      console.log('\n🔍 Testing Vector Search Priority:');
      console.log('-'.repeat(80));

      // Create a simple test embedding (all 0.01 values)
      const testEmbedding = '[' + Array(1536).fill(0.01).join(',') + ']';

      const searchResult = await client.query(`
        SELECT
          document_name,
          is_prompt,
          priority_order,
          chunk_text,
          1 - (embedding <=> $2::vector) as similarity
        FROM document_embeddings
        WHERE bot_id = $1
        ORDER BY priority_order ASC, embedding <=> $2::vector ASC
        LIMIT 5
      `, [bot.id, testEmbedding]);

      console.log('\nTop 5 Results (Prompts should appear first):');
      console.log('-'.repeat(80));

      searchResult.rows.forEach((row, index) => {
        const type = row.is_prompt ? '🎯 PROMPT' : '📄 CONTENT';
        const typeColor = row.is_prompt ? '\x1b[32m' : '\x1b[36m';
        const resetColor = '\x1b[0m';

        console.log(`\n${index + 1}. ${typeColor}${type}${resetColor} - ${row.document_name}`);
        console.log(`   Priority: ${row.priority_order} | Similarity: ${row.similarity.toFixed(4)}`);
        console.log(`   Preview: ${row.chunk_text.substring(0, 100)}...`);
      });

      // Verify prompts are first
      const promptsFirst = searchResult.rows.every((row, index) => {
        if (index === 0) return true;
        const prevRow = searchResult.rows[index - 1];
        return prevRow.priority_order <= row.priority_order;
      });

      console.log('\n' + '-'.repeat(80));
      if (promptsFirst) {
        console.log('✅ Priority System Working: Prompts are prioritized correctly!');
      } else {
        console.log('⚠️  Priority System Issue: Prompts are NOT appearing first');
      }
    }

    console.log('\n\n🎉 Test Complete!');
    console.log('\n📝 Next Steps:');
    console.log('1. If prompts are NOT detected: Re-upload documents with clearer instructions');
    console.log('2. If priority is wrong: Check migration was run successfully');
    console.log('3. Test real chat: Send messages through WordPress/n8n and verify bot behavior');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Connection refused. Check your DATABASE_URL in .env.local');
    } else if (error.message.includes('column') && error.message.includes('does not exist')) {
      console.error('\n💡 Column missing. Please run the migration: add_prompt_detection_columns.sql');
    }
  } finally {
    await client.end();
  }
}

// Run the test
console.log('🧪 Testing Prompt Detection and Priority System\n');
testPromptDetection();
