# n8n Workflow Setup for Smart Chat

## ⚠️ IMPORTANT: n8n is ONLY for Chat Responses (Not Training)

With the new architecture:
- **Training**: Done in Next.js (no n8n needed)
- **Chat Responses**: Uses n8n for RAG retrieval

## Required n8n Workflow Configuration

### Webhook URL
Your current webhook: `https://vizterasolutions.app.n8n.cloud/webhook/chat`

This should be a **POST** webhook that receives chat messages and returns AI responses with document context.

---

## Workflow Structure

```
1. Webhook (Trigger)
   ↓
2. OpenAI Embeddings (Convert message to vector)
   ↓
3. Supabase Vector Store (Retrieve relevant chunks)
   ↓
4. AI Agent / OpenAI Chat (Generate response)
   ↓
5. Postgres Chat Memory (Optional - Store history)
   ↓
6. Respond to Webhook (Return response)
```

---

## Step-by-Step Configuration

### 1. Webhook Node (Trigger)

**Settings:**
- **HTTP Method**: POST
- **Path**: `/webhook/chat`
- **Authentication**: None (or API key if desired)
- **Response Mode**: Respond Immediately

**Expected Request Body:**
```json
{
  "message": "What's your refund policy?",
  "chatId": "session_12345",
  "botId": "bot-uuid-here",
  "userId": "user-uuid-here"
}
```

---

### 2. OpenAI Embeddings Node

**Purpose:** Convert user's message into a vector for similarity search

**Settings:**
- **Resource**: Embeddings
- **Model**: text-embedding-ada-002
- **Input**: `{{ $json.message }}`

**Output:** Vector of 1536 dimensions

---

### 3. Supabase Vector Store (Retrieve Documents)

**Purpose:** Find relevant document chunks from training data

**Settings:**
- **Operation**: Retrieve Documents (similar to query)
- **Supabase URL**: `https://aucvnpwyrbefzfiqnrvd.supabase.co`
- **Supabase Key**: Your service role key (same as SUPABASE_SERVICE_ROLE_KEY)
- **Table Name**: `document_embeddings`
- **Query Embedding**: Use output from previous OpenAI Embeddings node
- **Top K**: 5 (return top 5 most relevant chunks)
- **Filter**:
  ```json
  {
    "bot_id": "{{ $('Webhook').item.json.botId }}"
  }
  ```

**Alternative: Use Supabase Node with Function**

If "Vector Store" node is not available, use **Supabase** node:

**Settings:**
- **Operation**: Execute SQL
- **Query**:
  ```sql
  SELECT * FROM match_document_embeddings(
    query_embedding := $1::vector,
    match_threshold := 0.7,
    match_count := 5,
    filter_bot_id := $2::uuid
  )
  ```
- **Parameters**:
  - `$1`: `{{ JSON.stringify($json.embedding) }}` (from OpenAI Embeddings)
  - `$2`: `{{ $('Webhook').item.json.botId }}`

**Output:** Array of document chunks with similarity scores

---

### 4. AI Agent / OpenAI Chat Model Node

**Purpose:** Generate intelligent response using retrieved context

**Option A: AI Agent Node (Recommended)**

**Settings:**
- **Model**: gpt-4.1-mini or gpt-4o-mini
- **System Message**:
  ```
  You are a helpful AI assistant for this business. Answer questions based on the provided context from company documents.

  If the context doesn't contain relevant information, politely say you don't have that information and suggest contacting support.

  Always be professional, friendly, and concise.
  ```
- **User Message**: `{{ $('Webhook').item.json.message }}`
- **Tools**: Attach Supabase Vector Store as a tool
- **Temperature**: 0.7
- **Max Tokens**: 500

**Option B: OpenAI Chat Node**

**Settings:**
- **Model**: gpt-4.1-mini
- **Messages**:
  1. **System**: (same as above)
  2. **User**:
    ```
    Context from documents:
    {{ $json.retrieved_chunks.map(chunk => chunk.chunk_text).join('\n\n') }}

    User Question: {{ $('Webhook').item.json.message }}
    ```

---

### 5. Postgres Chat Memory (Optional)

**Purpose:** Store conversation history for context-aware responses

**Settings:**
- **Connection**: Same as your main database
- **Table Name**: `n8n_chat_histories`
- **Session ID**: `{{ $('Webhook').item.json.chatId }}`

**Table Schema (if not exists):**
```sql
CREATE TABLE IF NOT EXISTS n8n_chat_histories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_session_id ON n8n_chat_histories(session_id);
```

---

### 6. Respond to Webhook Node

**Purpose:** Return AI response to the original webhook caller

**Settings:**
- **Response Body**:
  ```json
  {
    "success": true,
    "response": "{{ $json.output }}",
    "source": "n8n_rag",
    "botId": "{{ $('Webhook').item.json.botId }}"
  }
  ```
- **Status Code**: 200
- **Headers**:
  ```json
  {
    "Content-Type": "application/json"
  }
  ```

---

## Testing the Workflow

### 1. Manual Test in n8n

**Test Webhook:**
```bash
curl -X POST https://vizterasolutions.app.n8n.cloud/webhook/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is your refund policy?",
    "chatId": "test_123",
    "botId": "your-bot-uuid",
    "userId": "test-user"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "response": "Based on our company policy, we offer a 30-day money-back guarantee...",
  "source": "n8n_rag",
  "botId": "your-bot-uuid"
}
```

### 2. Check Execution Logs

- Go to n8n Executions
- Look for successful execution
- Verify:
  - Webhook received request ✅
  - Embeddings generated ✅
  - Vector search returned results ✅
  - AI generated response ✅
  - Webhook responded ✅

---

## Required Supabase Setup in n8n

### 1. Add Supabase Credentials

**n8n Dashboard → Credentials → Add Credential → Supabase**

**Settings:**
- **Host**: `https://aucvnpwyrbefzfiqnrvd.supabase.co`
- **Service Role Secret**: (Get from Supabase Dashboard)

### 2. Add OpenAI Credentials

**n8n Dashboard → Credentials → Add Credential → OpenAI**

**Settings:**
- **API Key**: Your OpenAI API key (same as in env)

---

## Troubleshooting

### Error: "Vector search returns no results"

**Causes:**
1. No embeddings in database (bot not trained yet)
2. Incorrect `bot_id` filter
3. Similarity threshold too high

**Solution:**
```sql
-- Check if embeddings exist
SELECT COUNT(*) FROM document_embeddings WHERE bot_id = 'your-bot-id';

-- Lower threshold in match function
SELECT * FROM match_document_embeddings(
  query_embedding := $1::vector,
  match_threshold := 0.5,  -- Lower from 0.7
  match_count := 5,
  filter_bot_id := $2::uuid
);
```

### Error: "Embedding dimensions mismatch"

**Cause:** Using different embedding models for training vs chat

**Solution:** Ensure both use `text-embedding-ada-002` (1536 dimensions)
- Training: embeddingService.ts:54 ✅
- Chat: n8n OpenAI Embeddings node ✅

### Error: "Supabase function not found"

**Cause:** Database migration not run

**Solution:**
```bash
# Run migration
psql $DATABASE_URL -f migrations/create_document_embeddings_table.sql
```

---

## Performance Optimization

### 1. Reduce Latency

**Current flow latency:**
- Embedding generation: ~200ms
- Vector search: ~100ms
- GPT response: ~1-3s
- **Total**: ~1.5-3.5s

**Optimization:**
- Use `gpt-4.1-mini` instead of `gpt-4` (faster, cheaper)
- Cache frequent questions
- Reduce `max_tokens` to 300-500

### 2. Cost Reduction

**Per 1000 messages:**
- Embeddings: $0.10 (1000 queries × $0.0001)
- GPT-4.1-mini: $3-5 (depends on context size)
- **Total**: ~$3-5 per 1000 messages

---

## Summary Checklist

- [ ] Update n8n webhook URL to `/webhook/chat`
- [ ] Add Supabase credentials to n8n
- [ ] Add OpenAI credentials to n8n
- [ ] Create workflow with 6 nodes (Webhook → Embeddings → Vector Search → AI Agent → Memory → Respond)
- [ ] Configure vector search to filter by `bot_id`
- [ ] Test with sample message
- [ ] Verify response includes document context
- [ ] Deploy workflow and activate

---

## Next Steps

1. **Get Supabase Service Role Key** (if you don't have it)
2. **Run Database Migration** (create document_embeddings table)
3. **Update n8n Workflow** (use this guide)
4. **Train a Bot** (upload documents, click "Train Bot")
5. **Test Chat** (send message via WordPress, verify n8n returns contextual answer)

Your n8n webhook is already configured at: `https://vizterasolutions.app.n8n.cloud/webhook/chat`

Just need to ensure the workflow matches this architecture! 🚀
