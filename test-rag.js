require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function testRAG() {
  console.log('🧪 Testing RAG Implementation...\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();

    // Check pgvector extension
    console.log('1️⃣ Checking pgvector extension...');
    const extCheck = await client.query("SELECT * FROM pg_extension WHERE extname = 'vector'");
    if (extCheck.rows.length > 0) {
      console.log('   ✅ pgvector installed');
    } else {
      console.log('   ❌ pgvector NOT installed');
      return;
    }

    // Check DocumentEmbedding table
    console.log('\n2️⃣ Checking document_embeddings table...');
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'document_embeddings'
      );
    `);

    if (tableCheck.rows[0].exists) {
      console.log('   ✅ document_embeddings table exists');

      // Check structure
      const columns = await client.query(`
        SELECT column_name, data_type, udt_name
        FROM information_schema.columns
        WHERE table_name = 'document_embeddings'
        ORDER BY ordinal_position;
      `);

      console.log('   Columns:');
      columns.rows.forEach(col => {
        console.log(`     - ${col.column_name}: ${col.udt_name || col.data_type}`);
      });

      // Count embeddings
      const countResult = await client.query('SELECT COUNT(*) FROM document_embeddings');
      console.log(`\n   Total embeddings: ${countResult.rows[0].count}`);

      if (parseInt(countResult.rows[0].count) > 0) {
        // Show sample
        const sample = await client.query(`
          SELECT id, "botId", "chunkIndex", "tokenCount",
                 LEFT(content, 50) as content_preview,
                 CASE WHEN embedding IS NOT NULL THEN 'Yes' ELSE 'No' END as has_embedding
          FROM document_embeddings
          LIMIT 3
        `);

        console.log('\n   Sample embeddings:');
        sample.rows.forEach(row => {
          console.log(`     - Chunk ${row.chunkIndex}: ${row.content_preview}... (${row.tokenCount} tokens, Embedding: ${row.has_embedding})`);
        });
      }
    } else {
      console.log('   ⚠️  document_embeddings table does NOT exist yet');
      console.log('   This is normal - table will be created when you start the server');
    }

    // Check Documents table
    console.log('\n3️⃣ Checking documents...');
    const docsCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'documents'
      );
    `);

    if (docsCheck.rows[0].exists) {
      const docsCount = await client.query('SELECT COUNT(*) FROM documents');
      console.log(`   ✅ ${docsCount.rows[0].count} documents in database`);

      if (parseInt(docsCount.rows[0].count) > 0) {
        const docs = await client.query(`
          SELECT id, name, type, status,
                 CASE WHEN content IS NOT NULL THEN 'Yes' ELSE 'No' END as has_content
          FROM documents
          LIMIT 5
        `);

        console.log('   Recent documents:');
        docs.rows.forEach(doc => {
          console.log(`     - ${doc.name} (${doc.type}) - Status: ${doc.status}, Content: ${doc.has_content}`);
        });
      }
    } else {
      console.log('   ⚠️  documents table does NOT exist yet');
    }

    console.log('\n✅ RAG System Check Complete!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Upload documents through the dashboard');
    console.log('   2. Call POST /api/documents/process-embeddings with documentId and botId');
    console.log('   3. Embeddings will be generated automatically');
    console.log('   4. Chat endpoint will use RAG to find relevant context');

    client.release();
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

testRAG();
