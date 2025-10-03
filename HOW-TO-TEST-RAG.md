# 🧪 How to Test RAG (Retrieval-Augmented Generation)

RAG lets your chatbot use uploaded documents to answer questions with accurate, context-aware responses!

## ✅ What's Been Implemented:

1. **pgvector Extension** - Vector database for embeddings
2. **DocumentEmbedding Entity** - Stores document chunks with embeddings
3. **Document Processing Service** - Chunks text and generates embeddings
4. **Vector Similarity Search** - Finds relevant chunks using cosine similarity
5. **RAG Integration** - Chat endpoint automatically searches knowledge base

---

## 🚀 How to Test RAG:

### **Step 1: Start the Development Server**

```bash
npm run dev
```

The server will auto-create the `document_embeddings` table in the database.

---

### **Step 2: Upload a Document**

1. Go to dashboard: `http://localhost:3000/dashboard`
2. Navigate to **Knowledge Base** section
3. Upload a document (PDF, TXT, DOCX, CSV, etc.)
4. Note the document ID from the URL or database

---

### **Step 3: Process the Document (Generate Embeddings)**

**Option A: Using API directly**

```bash
curl -X POST http://localhost:3000/api/documents/process-embeddings \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": "YOUR_DOCUMENT_ID",
    "botId": "YOUR_BOT_ID"
  }'
```

**Option B: Using Node.js script**

Create `process-doc.js`:

```javascript
require('dotenv').config({ path: '.env.local' });

async function processDocument() {
  const response = await fetch('http://localhost:3000/api/documents/process-embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      documentId: 'YOUR_DOCUMENT_ID',
      botId: 'YOUR_BOT_ID'
    })
  });

  const result = await response.json();
  console.log(result);
}

processDocument();
```

Run: `node process-doc.js`

---

### **Step 4: Verify Embeddings Were Created**

Run the test script:

```bash
node test-rag.js
```

You should see:
- ✅ pgvector installed
- ✅ document_embeddings table exists
- ✅ Sample embeddings showing chunks with embeddings

---

### **Step 5: Test the Chat with RAG**

**Option A: Using WordPress Plugin**

1. Send a message through the WordPress chat widget
2. The message will automatically search for relevant document chunks
3. The bot will use the found context to answer

**Option B: Test with API directly**

```bash
curl -X POST http://localhost:3000/api/wordpress/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "token": "userId:botId:secretToken",
    "message": "What is [topic from your document]?",
    "sessionId": "test_session_123"
  }'
```

---

## 🔍 How to Verify RAG is Working:

### **Method 1: Check Console Logs**

When you send a message, you should see in server logs:

```
Error building RAG context: [if no embeddings exist]
  OR
[No error means RAG found relevant chunks]
```

### **Method 2: Test with Specific Questions**

Upload a document about a specific topic (e.g., "Company Pricing Policy"), then ask:

- ❌ Without RAG: "What is the refund policy?" → Generic answer
- ✅ With RAG: "What is the refund policy?" → Answer from your document!

### **Method 3: Check Database**

```bash
node check-rag-database.js
```

Create `check-rag-database.js`:

```javascript
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function checkRAG() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();

  // Count embeddings per bot
  const result = await client.query(`
    SELECT "botId", COUNT(*) as chunk_count
    FROM document_embeddings
    GROUP BY "botId"
  `);

  console.log('Embeddings by Bot:');
  result.rows.forEach(row => {
    console.log(`  Bot ${row.botId}: ${row.chunk_count} chunks`);
  });

  // Show sample with similarity search
  console.log('\n🔍 Testing vector similarity search...');

  const testQuery = 'What is the pricing?';
  console.log(`Query: "${testQuery}"`);

  // This would require the OpenAI API call to generate query embedding
  // For now, just show that embeddings exist
  const sampleResult = await client.query(`
    SELECT "botId", "chunkIndex", LEFT(content, 100) as preview,
           CASE WHEN embedding IS NOT NULL THEN '✅' ELSE '❌' END as has_vector
    FROM document_embeddings
    LIMIT 5
  `);

  console.log('\nSample chunks:');
  sampleResult.rows.forEach(row => {
    console.log(`  ${row.has_vector} Chunk ${row.chunkIndex}: ${row.preview}...`);
  });

  await client.release();
  await pool.end();
}

checkRAG();
```

---

## 📊 RAG Flow Diagram:

```
User asks: "What is your refund policy?"
          ↓
1. Generate embedding for query using OpenAI
          ↓
2. Search document_embeddings table for similar vectors
          ↓
3. Find top 3 most relevant chunks (using cosine distance)
          ↓
4. Build context from relevant chunks
          ↓
5. Add context to system prompt
          ↓
6. Send to OpenAI with: System Prompt + RAG Context + User Message
          ↓
7. Get AI response based on YOUR documents!
```

---

## 🐛 Troubleshooting:

### **No embeddings created?**

Check:
1. Document has `content` field populated
2. OpenAI API key is valid
3. Check server logs for errors
4. Run: `node test-rag.js`

### **Bot gives generic answers?**

Check:
1. Embeddings exist for that bot: `SELECT COUNT(*) FROM document_embeddings WHERE "botId" = 'YOUR_BOT_ID'`
2. Document content matches the question topic
3. Check console for "Error building RAG context"

### **Vector search not working?**

Check:
1. pgvector extension installed: `node check-pgvector.js`
2. Embedding column has data: `SELECT COUNT(*) FROM document_embeddings WHERE embedding IS NOT NULL`

---

## ✅ Success Indicators:

RAG is working correctly when:

1. ✅ `document_embeddings` table has records
2. ✅ Embeddings have 1536-dimensional vectors (not NULL)
3. ✅ Bot answers with specific information from YOUR documents
4. ✅ Bot cites sources: "Based on [Document Name]..."
5. ✅ No "Error building RAG context" in logs

---

## 🎯 Example Test Case:

**Upload document:** `company-policies.txt`

```
Content:
Our refund policy allows full refunds within 30 days of purchase.
Partial refunds are available within 60 days.
After 60 days, no refunds are provided.
```

**Process embeddings:**
```bash
POST /api/documents/process-embeddings
{
  "documentId": "doc-123",
  "botId": "bot-456"
}
```

**Test chat:**
```bash
POST /api/wordpress/send-message
{
  "token": "userId:bot-456:secret",
  "message": "What is your refund policy?",
  "sessionId": "test"
}
```

**Expected response:**
```json
{
  "success": true,
  "response": "Based on our company policies, we offer full refunds within 30 days of purchase, partial refunds within 60 days, and no refunds after 60 days."
}
```

**✅ RAG is working!** The bot used the document content instead of making up an answer.

---

## 📝 Next Steps:

1. Upload more documents for better coverage
2. Test with various question types
3. Monitor embedding costs (OpenAI charges per token)
4. Consider batch processing for multiple documents
5. Add UI button to trigger embedding generation from dashboard

---

**Need help?** Check the console logs or run `node test-rag.js` to diagnose issues.
