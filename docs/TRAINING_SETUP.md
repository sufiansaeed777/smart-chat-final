# Bot Training Setup Guide

## Overview

This guide explains how bot training works in the Smart Chat SaaS application.

## Architecture

```
User uploads document → Document stored in database
   ↓
User assigns document to bot → Linked in bot_documents table
   ↓
User clicks "Train Bot" → API processes document directly
   ↓
Extract text (PDF/CSV/TXT) → Split into chunks → Generate embeddings → Store in Supabase
   ↓
Bot status: 'trained'
   ↓
WordPress user sends message → n8n retrieves context → GPT generates answer
```

## Training Flow (No n8n)

**Training is done directly in Next.js:**

1. **Text Extraction** (`textExtraction.ts`)
   - Supports PDF, CSV, TXT
   - Extracts plain text from files

2. **Text Chunking** (`textChunking.ts`)
   - RecursiveCharacterTextSplitter
   - Chunk size: 1000 characters
   - Overlap: 200 characters

3. **Embedding Generation** (`embeddingService.ts`)
   - OpenAI text-embedding-ada-002
   - 1536 dimensions per embedding
   - Stores in Supabase `document_embeddings` table

## Chat Flow (Uses n8n)

**Chat responses use n8n for RAG:**

1. User sends message via WordPress
2. Message sent to n8n webhook
3. n8n searches `document_embeddings` table
4. n8n retrieves top 5 relevant chunks
5. n8n sends to GPT-4 with context
6. n8n returns intelligent answer

## Setup Instructions

### 1. Run Database Migration

```bash
# Connect to your Supabase database
psql $DATABASE_URL -f migrations/create_document_embeddings_table.sql

# Or use Supabase SQL Editor:
# - Open Supabase Dashboard
# - Go to SQL Editor
# - Copy/paste migration contents
# - Click RUN
```

### 2. Configure Environment Variables

```bash
# .env.local
OPENAI_API_KEY=sk-...                    # For embeddings
NEXT_PUBLIC_SUPABASE_URL=https://...     # Supabase project URL
SUPABASE_SERVICE_ROLE_KEY=eyJh...        # Service role key (for embeddings)
N8N_WEBHOOK_URL=https://...              # For chat responses only
```

### 3. Update n8n Workflow

The n8n workflow should **ONLY** handle chat responses (not training):

**Required n8n Nodes:**

1. **Webhook** - Receives chat messages
   ```json
   {
     "body": {
       "message": "What's your refund policy?",
       "chat_id": "session123",
       "bot_id": "bot-uuid",
       "user_id": "user-uuid"
     }
   }
   ```

2. **Supabase Vector Store (Retrieve)**
   - Table: `document_embeddings`
   - Function: `match_document_embeddings`
   - Mode: Retrieve as tool
   - Filter by: `bot_id`

3. **Embeddings OpenAI**
   - Model: text-embedding-ada-002

4. **OpenAI Chat Model**
   - Model: gpt-4.1-mini or gpt-3.5-turbo

5. **AI Agent**
   - System message: "You are a helpful assistant..."
   - Tools: Vector store retrieval

6. **Postgres Chat Memory** (Optional)
   - Table: `n8n_chat_histories`
   - Session ID: `chat_id`

7. **Respond to Webhook**
   - Return: `{ Response: <answer> }`

### 4. Test Training

```bash
# 1. Create a bot in dashboard
# 2. Upload a document (PDF/CSV/TXT)
# 3. Assign document to bot
# 4. Click "Train Bot (n8n)" from dropdown
# 5. Check console logs for progress
# 6. Bot status should change to "trained"
```

**Expected Output:**
```
📄 Processing document: company_policy.pdf
✅ Extracted 5000 words from company_policy.pdf
✅ Split into 12 chunks
✅ Embedding 1/12 stored for document company_policy.pdf
✅ Embedding 2/12 stored for document company_policy.pdf
...
✅ Training completed: 12 embeddings created
```

### 5. Test Chat

```bash
# 1. Install WordPress plugin on a site
# 2. Configure plugin with bot token
# 3. Send a message related to your documents
# 4. Bot should respond with context from documents
```

## File Structure

```
src/
├── services/
│   ├── textExtraction.ts      # Extract text from files
│   ├── textChunking.ts         # Split text into chunks
│   ├── embeddingService.ts     # Generate & store embeddings
│   └── n8nService.ts           # Chat with n8n (unchanged)
├── app/api/
│   ├── n8n/train-bot/route.ts # Training endpoint (updated)
│   └── wordpress/send-message/ # Chat endpoint (uses n8n)
migrations/
├── create_document_embeddings_table.sql
└── add_n8n_training_fields.sql
```

## Database Schema

### `document_embeddings` Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| bot_id | UUID | Foreign key to bots table |
| document_id | UUID | Foreign key to documents table |
| document_name | VARCHAR | Document filename |
| chunk_text | TEXT | The actual text chunk |
| chunk_index | INTEGER | Chunk position (0-based) |
| total_chunks | INTEGER | Total chunks in document |
| embedding | vector(1536) | Vector embedding |
| created_at | TIMESTAMP | Created timestamp |

### Search Function

```sql
SELECT * FROM match_document_embeddings(
  query_embedding := '[0.1, 0.2, ...]'::vector,
  match_threshold := 0.7,
  match_count := 5,
  filter_bot_id := 'bot-uuid'
);
```

## Troubleshooting

### Training Fails

**Error: "File path not found"**
- Check document has `filePath` or `path` field
- Verify file exists in filesystem

**Error: "Failed to extract text from PDF"**
- Ensure `pdf-parse` is installed: `npm install pdf-parse`
- Check PDF is not corrupted or password-protected

**Error: "Failed to store embedding"**
- Run database migration
- Check Supabase credentials
- Verify `document_embeddings` table exists

**Error: "OpenAI API error"**
- Check `OPENAI_API_KEY` is valid
- Ensure account has credits
- Rate limit may be exceeded

### Chat Not Using Context

**Bot returns generic answers:**
- Verify bot `trainingStatus` is "trained"
- Check embeddings exist: `SELECT COUNT(*) FROM document_embeddings WHERE bot_id = 'xxx'`
- Test n8n workflow manually
- Check n8n has correct Supabase credentials

**n8n returns errors:**
- Verify n8n can connect to Supabase
- Check vector search function exists
- Test embedding generation in n8n

## Performance

### Training Speed

- Small doc (< 1000 words): ~5 seconds
- Medium doc (1000-10000 words): ~30 seconds
- Large doc (> 10000 words): ~2 minutes

### Cost Estimate

**OpenAI Embeddings:**
- Model: text-embedding-ada-002
- Cost: $0.0001 per 1K tokens
- Example: 10,000 word document = ~15,000 tokens = $0.0015

**Chat Responses:**
- Model: GPT-4.1-mini
- Cost: ~$0.30 per 1M tokens
- Example: 100 messages = ~$0.03

## Maintenance

### Delete Bot Embeddings

```sql
DELETE FROM document_embeddings WHERE bot_id = 'bot-uuid';
```

### Retrain Bot

When you click "Train Bot" again, it automatically:
1. Deletes all existing embeddings
2. Reprocesses all documents
3. Creates fresh embeddings

### Monitor Usage

```sql
-- Embeddings per bot
SELECT bot_id, COUNT(*) as embedding_count
FROM document_embeddings
GROUP BY bot_id;

-- Storage size
SELECT pg_size_pretty(pg_total_relation_size('document_embeddings'));
```

## Summary

✅ **Training**: Done in Next.js (no n8n)
✅ **Chat**: Uses n8n for RAG retrieval
✅ **Storage**: Supabase pgvector
✅ **Embeddings**: OpenAI ada-002
✅ **Chat Model**: GPT-4.1-mini
