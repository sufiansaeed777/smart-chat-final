# n8n Workflow Fix - Proper RAG Implementation

## Problem

The current n8n workflow fetches ALL document chunks for a bot and sends them to the LLM, causing:
1. **Token waste**: 4200+ tokens per request instead of ~500-1000
2. **Cost multiplication**: Processing multiple items separately (3x cost)
3. **Scale issues**: Will error out or become expensive as data grows

## Solution

Use the existing Supabase `match_document_embeddings` RPC function to do **vector similarity search** and return only the top 3-5 most relevant chunks.

---

## Step-by-Step n8n Workflow Changes

### Step 1: Update HTTP Request1 (Supabase Query)

**Current Setup (WRONG):**
- Method: GET
- URL: `https://aucvnpwyrbefzfiqnrvd.supabase.co/rest/v1/document_embeddings`
- Query params: `bot_id`, `select`, `limit`

**New Setup (CORRECT):**
- Method: **POST**
- URL: `https://aucvnpwyrbefzfiqnrvd.supabase.co/rest/v1/rpc/match_document_embeddings`
- Body Content Type: **JSON**
- JSON Body:

```json
{
  "query_embedding": {{ $('HTTP Request').first().json.data[0].embedding }},
  "match_threshold": 0.5,
  "match_count": 5,
  "filter_bot_id": "{{ $('Webhook1').first().json.body.bot_id }}"
}
```

### Step 2: Update Headers for Supabase RPC

Make sure these headers are set (usually handled by Supabase credential):
- `Content-Type`: `application/json`
- `apikey`: Your Supabase anon/service key
- `Authorization`: `Bearer YOUR_SUPABASE_KEY`

### Step 3: Update "Message a model" Context

The RPC function returns an array with these fields:
- `chunk_text` - The relevant text
- `document_name` - Source document
- `similarity` - Match score (0-1)

Update the User prompt to:

```
Context: {{ $('HTTP Request1').all().map(item => item.json.chunk_text).join('\n\n') }}

Question: {{ $('Webhook1').first().json.body.message }}
```

---

## How It Works Now

### Before (Inefficient):
```
User Question → Fetch ALL chunks for bot → Send ALL to LLM
Tokens: 4200+ per request
```

### After (Efficient):
```
User Question → Generate Embedding → Vector Similarity Search → Top 5 relevant chunks only → Send to LLM
Tokens: ~500-1000 per request (80% reduction)
```

---

## Supabase Function Reference

The `match_document_embeddings` function is already in your database:

```sql
match_document_embeddings(
  query_embedding vector(1536),  -- Embedding of user's question
  match_threshold float DEFAULT 0.7,  -- Minimum similarity (0.5 recommended)
  match_count int DEFAULT 5,  -- Number of results
  filter_bot_id UUID DEFAULT NULL  -- Filter by bot
)
```

Returns:
- `id` - Embedding ID
- `bot_id` - Bot ID
- `document_id` - Source document ID
- `document_name` - Document name
- `chunk_text` - The actual text content
- `chunk_index` - Position in document
- `similarity` - Match score (higher = better)

---

## Testing

1. Update HTTP Request1 as described above
2. Send a test message to the bot
3. Check HTTP Request1 output - should show only relevant chunks with similarity scores
4. Verify token usage is reduced significantly

---

## Threshold Tuning

- `0.7` - High precision, may miss some relevant content
- `0.5` - Balanced (recommended)
- `0.3` - High recall, may include less relevant content

Adjust `match_threshold` based on your needs.
