# Bot Training Setup Guide

## Overview

This guide explains how bot training works in the Smart Chat SaaS application, following the official ROADMAP Phase 3 specifications.

## Architecture (Per ROADMAP)

```
User uploads document → Document stored in database
   ↓
User assigns document to bot → Linked in bot_documents table
   ↓
User clicks "Train Bot" → Next.js sends document to n8n
   ↓
n8n processes: Parse → Chunk → Generate Embeddings (text-embedding-3-large) → Store in Supabase
   ↓
n8n responds: Success/Failure → Bot status updated
   ↓
WordPress user sends message → n8n retrieves context → GPT generates answer
```

## Training Flow (Via n8n - Per ROADMAP)

**Training is done via n8n as specified in ROADMAP Phase 3:**

> "Process documents via n8n: parse → chunk → generate embeddings (text-embedding-3-large)"

### Step-by-Step Process:

1. **Next.js API** (`/api/n8n/train-bot`)
   - Receives training request
   - Reads document file
   - Sends document data to n8n webhook

2. **n8n Workflow** (Workflow ID: V8OQdCTe2Z1evyNU)
   - **Parse**: Extracts text from PDF/CSV/TXT
   - **Chunk**: Splits text into 1000-char chunks with 200-char overlap
   - **Embed**: Generates embeddings using OpenAI text-embedding-3-large
   - **Store**: Saves vectors (3072 dimensions) in Supabase pgvector

3. **Next.js Receives Response**
   - Updates bot `trainingStatus` to 'trained'
   - Saves training log

## Chat Flow (Via n8n - RAG Retrieval)

**Chat responses use n8n for RAG:**

1. User sends message via WordPress
2. Message forwarded to n8n webhook
3. n8n generates query embedding (text-embedding-3-large, 3072 dim)
4. n8n searches `document_embeddings` table using cosine similarity
5. n8n retrieves top 5 relevant chunks
6. n8n sends chunks + query to GPT-4.1-mini
7. n8n returns intelligent, context-aware answer

---

## Setup Instructions

### 1. Run Database Migration

**Important**: Migration uses **vector(3072)** for text-embedding-3-large (not 1536)

```bash
# Connect to your Supabase database (lvfitfucwdyeqwgphlud)
psql $DATABASE_URL -f migrations/create_document_embeddings_table.sql

# Or use Supabase SQL Editor:
# 1. Go to: https://supabase.com/dashboard/project/lvfitfucwdyeqwgphlud/sql
# 2. Click "New Query"
# 3. Copy/paste migration SQL
# 4. Click "RUN"
```

### 2. Configure Environment Variables

```bash
# .env.local (Production Configuration from Saas_AI_Chatbot_Keys.pdf)

# OpenAI API (for embeddings in n8n)
OPENAI_API_KEY=sk-proj-LS-DD5rE7cvk5hdZF2WRJ...

# Supabase (PRODUCTION - from Keys PDF)
NEXT_PUBLIC_SUPABASE_URL=https://lvfitfucwdyeqwgphlud.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<get from Supabase dashboard>

# n8n Webhook (PRODUCTION - from Keys PDF)
N8N_WEBHOOK_URL=https://synofexai.app.n8n.cloud/webhook/c724f29c-cc20-4409-90c2-d4a494ad3e41
# Workflow ID: V8OQdCTe2Z1evyNU
```

### 3. Configure n8n Workflow

**Important**: The n8n workflow handles **BOTH** training and chat (per ROADMAP)

#### Required n8n Nodes for Training:

1. **Webhook** - Receives training requests
   ```json
   {
     "type": "training",
     "botId": "bot-uuid",
     "botName": "My Bot",
     "documentId": "doc-uuid",
     "documentName": "policy.pdf",
     "documentContent": "Full text content...",
     "documentType": "application/pdf",
     "action": "train"
   }
   ```

2. **Code Node** - Parse document based on type
   - PDF: Extract text from base64
   - CSV: Parse rows into readable text
   - TXT: Use as-is

3. **Code Node** - Chunk text
   - Chunk size: 1000 characters
   - Overlap: 200 characters
   - RecursiveCharacterTextSplitter logic

4. **OpenAI Embeddings**
   - **Model**: text-embedding-3-large (REQUIRED per ROADMAP)
   - **Dimensions**: 3072
   - Input: Each text chunk

5. **Supabase**
   - Operation: Insert
   - Table: `document_embeddings`
   - Fields:
     - `bot_id`: From webhook
     - `document_id`: From webhook
     - `document_name`: From webhook
     - `chunk_text`: Current chunk
     - `chunk_index`: Index in array
     - `total_chunks`: Array length
     - `embedding`: Vector from OpenAI (3072 dim)

6. **Respond to Webhook**
   - Return: `{ success: true, message: "Training complete" }`

#### Required n8n Nodes for Chat:

1. **Webhook** - Receives chat messages
2. **OpenAI Embeddings** - Convert message to vector (text-embedding-3-large)
3. **Supabase Vector Store** - Search using `match_document_embeddings()`
4. **OpenAI Chat Model** - Generate response (GPT-4.1-mini)
5. **Respond to Webhook** - Return answer

---

## Database Schema

### `document_embeddings` Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| bot_id | UUID | Foreign key to bots table |
| document_id | UUID | Foreign key to documents table |
| document_name | VARCHAR(255) | Document filename |
| chunk_text | TEXT | The actual text chunk |
| chunk_index | INTEGER | Chunk position (0-based) |
| total_chunks | INTEGER | Total chunks in document |
| **embedding** | **vector(3072)** | **Vector embedding (3072 dimensions from text-embedding-3-large)** |
| created_at | TIMESTAMP | Created timestamp |

### Search Function

```sql
CREATE OR REPLACE FUNCTION match_document_embeddings(
  query_embedding vector(3072),  -- 3072 for text-embedding-3-large
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  filter_bot_id UUID DEFAULT NULL
)
RETURNS TABLE (...)
```

---

## Testing

### Test Training Flow

```bash
# 1. Create a bot in dashboard
# 2. Upload a document (PDF/CSV/TXT)
# 3. Assign document to bot
# 4. Click "Train Bot (n8n)" from dropdown
# 5. Check Vercel logs for progress
```

**Expected Logs:**
```
🚀 Starting n8n-based training for bot: My Bot
📦 Documents to process: 1
📄 Processing document: policy.pdf
✅ Read policy.pdf (15000 bytes)
✅ n8n processed policy.pdf successfully
🎯 Training completed: 1/1 documents successful
📊 Bot status: trained
```

**Check n8n Execution:**
```
Go to: https://synofexai.app.n8n.cloud/executions
Find: Latest execution
Verify:
  - Webhook received document
  - Text was chunked
  - Embeddings generated (text-embedding-3-large, 3072 dim)
  - Supabase insert succeeded
```

### Test Chat Flow

```bash
# 1. Install WordPress plugin
# 2. Configure with bot token
# 3. Send message: "What is your refund policy?"
# 4. Bot should respond with context from documents
```

**Verify in n8n:**
- Query embedding generated (3072 dimensions)
- Vector search returned relevant chunks
- GPT response included document context

---

## Troubleshooting

### Training Fails

**Error: "n8n not configured"**
- Check `N8N_WEBHOOK_URL` is set correctly
- Verify: `https://synofexai.app.n8n.cloud/webhook/c724f29c-cc20-4409-90c2-d4a494ad3e41`

**Error: "n8n training failed: 404"**
- n8n workflow may not exist
- Check workflow ID: V8OQdCTe2Z1evyNU
- Verify workflow is activated in n8n

**Error: "Failed to store embedding"**
- Check database migration ran successfully
- Verify table has `vector(3072)` column (not 1536)
- Check Supabase credentials in n8n

**Error: "OpenAI API error"**
- Verify OpenAI API key is valid
- Check account has credits
- Confirm text-embedding-3-large is available

### Chat Not Using Context

**Bot returns generic answers:**
- Verify bot `trainingStatus` is "trained"
- Check embeddings exist:
  ```sql
  SELECT COUNT(*) FROM document_embeddings WHERE bot_id = 'xxx';
  ```
- Test n8n chat workflow manually
- Verify n8n uses text-embedding-3-large (not ada-002)

**Dimension mismatch error:**
- Training used 1536 dimensions but should use 3072
- Drop and recreate `document_embeddings` table
- Retrain all bots

---

## Performance

### Training Speed (via n8n)

- Small doc (< 1000 words): ~10 seconds
- Medium doc (1000-10000 words): ~45 seconds
- Large doc (> 10000 words): ~3 minutes

*Note: n8n processing is slightly slower than direct processing but more scalable*

### Cost Estimate

**OpenAI Embeddings (text-embedding-3-large):**
- Cost: $0.00013 per 1K tokens
- Example: 10,000 word document ≈ 15,000 tokens = **$0.00195**

**Chat Responses (GPT-4.1-mini):**
- Cost: ~$0.30 per 1M tokens
- Example: 100 messages ≈ ~$0.03

**Total for 10 bots (10K words each):**
- Training: 10 × $0.00195 = **$0.0195**
- Chat (1000 messages): **$0.30**
- **Monthly**: ~$0.32

---

## Maintenance

### Delete Bot Embeddings

```sql
DELETE FROM document_embeddings WHERE bot_id = 'bot-uuid';
```

### Retrain Bot

When you click "Train Bot" again:
1. n8n receives retrain request
2. Old embeddings remain (or delete manually first)
3. n8n processes documents
4. New embeddings added

**Best Practice**: Delete old embeddings first for clean retrain:
```sql
DELETE FROM document_embeddings WHERE bot_id = 'bot-uuid';
```

### Monitor Usage

```sql
-- Embeddings per bot
SELECT bot_id, COUNT(*) as embedding_count
FROM document_embeddings
GROUP BY bot_id;

-- Average chunks per document
SELECT AVG(total_chunks) FROM document_embeddings;

-- Storage size
SELECT pg_size_pretty(pg_total_relation_size('document_embeddings'));
```

---

## Architecture Comparison

### ROADMAP Specification (Current Implementation)

✅ **Training**: Via n8n (ROADMAP Phase 3)
✅ **Embedding Model**: text-embedding-3-large (ROADMAP Phase 3)
✅ **Dimensions**: 3072
✅ **Chat**: Via n8n with RAG retrieval
✅ **Storage**: Supabase pgvector

### Previous Implementation (Deprecated)

❌ **Training**: Direct in Next.js (not per ROADMAP)
❌ **Embedding Model**: text-embedding-ada-002 (wrong model)
❌ **Dimensions**: 1536 (incompatible)

---

## Summary

✅ **Training**: Done via n8n (per ROADMAP Phase 3)
✅ **Chat**: Uses n8n for RAG retrieval
✅ **Storage**: Supabase pgvector (project: lvfitfucwdyeqwgphlud)
✅ **Embeddings**: OpenAI text-embedding-3-large (3072 dimensions)
✅ **Chat Model**: GPT-4.1-mini
✅ **n8n Instance**: synofexai.app.n8n.cloud
✅ **Workflow ID**: V8OQdCTe2Z1evyNU

**All components now comply with official ROADMAP specifications.**
