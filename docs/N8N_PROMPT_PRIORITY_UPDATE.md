# n8n Workflow Update for Prompt Prioritization

## Overview
After running the database migration (`add_prompt_detection_columns.sql`), your n8n workflow will automatically prioritize prompt documents over content documents in search results.

## What Changed

### Database Function Update
The `match_document_embeddings` function now:
- Returns prompt documents FIRST (priority_order = 1)
- Then returns content documents by similarity (priority_order = 100)
- Includes two new fields in results: `is_prompt` and `priority_order`

### No n8n Workflow Changes Needed! ✅

Your existing n8n workflow already calls `match_document_embeddings`, so it will automatically use the new priority logic once the migration runs.

## Verification Steps

### 1. Run the SQL Migration
In Supabase SQL Editor:
```sql
-- Copy and run the entire contents of:
-- migrations/add_prompt_detection_columns.sql
```

### 2. Verify the Function Works
Test the updated function:
```sql
-- Replace with your actual bot_id and a test embedding vector
SELECT
  document_name,
  is_prompt,
  priority_order,
  similarity
FROM match_document_embeddings(
  query_embedding := '[0.1, 0.2, ...]'::vector(1536),
  match_threshold := 0.5,
  match_count := 10,
  filter_bot_id := 'your-bot-id'::uuid
);
```

Expected output should show:
- Prompt documents first (is_prompt = true, priority_order = 1)
- Then content documents (is_prompt = false, priority_order = 100)

### 3. Test in n8n
Send a test message through your n8n workflow:

```bash
curl -X POST https://vizterasolutions.app.n8n.cloud/webhook/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What should your tone be?",
    "chatId": "test_123",
    "botId": "your-bot-id",
    "userId": "test-user"
  }'
```

The response should reflect the bot's personality/instructions from prompt documents.

## How It Works

### Before Migration
Vector search returns results sorted ONLY by similarity:
```
1. Content chunk (similarity: 0.92)
2. Content chunk (similarity: 0.88)
3. Prompt instruction (similarity: 0.75)  ← Lost in the noise!
```

### After Migration
Vector search returns results sorted by priority FIRST, then similarity:
```
1. Prompt instruction (priority: 1, similarity: 0.75)  ← Always first!
2. Prompt instruction (priority: 1, similarity: 0.72)
3. Content chunk (priority: 100, similarity: 0.92)
```

## Automatic Prompt Detection

The training service now automatically detects if a document is a prompt by analyzing content for:
- Direct AI instructions ("you are", "you should", "you must")
- Role definitions ("your role", "your personality")
- Behavioral instructions ("be helpful", "use emoji")
- Constraint instructions ("always", "never", "do not")

**No manual tagging needed!** Just upload documents and the system classifies them automatically.

## Example Use Cases

### Case 1: Bot Personality + FAQ Content
- Upload "Bot Instructions.txt" → Auto-detected as prompt (priority 1)
- Upload "Company FAQ.pdf" → Auto-detected as content (priority 100)
- Result: Bot always follows instructions while answering FAQ questions

### Case 2: Multiple Instruction Sets
- Upload "Tone Guidelines.txt" → Prompt (priority 1)
- Upload "Response Templates.txt" → Prompt (priority 1)
- Upload "Product Catalog.pdf" → Content (priority 100)
- Result: Bot uses both instruction sets to format product responses

## Troubleshooting

### Issue: Bot not following prompt instructions
**Possible causes:**
1. Migration not run yet
2. Bot not re-trained after migration
3. Prompt document not detected as prompt

**Solution:**
```sql
-- Check if prompts are marked correctly
SELECT document_name, is_prompt, priority_order, COUNT(*) as chunks
FROM document_embeddings
WHERE bot_id = 'your-bot-id'
GROUP BY document_name, is_prompt, priority_order;

-- If prompts are marked wrong, delete and re-upload
DELETE FROM document_embeddings WHERE bot_id = 'your-bot-id';
-- Then re-train the bot through the dashboard
```

### Issue: All documents marked as content (priority 100)
**Cause:** Documents don't contain enough prompt indicators

**Solution:**
Make prompt documents more explicit:
```
❌ Bad prompt:
"Be friendly and helpful"

✅ Good prompt:
"You are a friendly customer service assistant. Your role is to help customers with their questions. You should always be professional and courteous. Never use technical jargon."
```

## Next Steps

1. ✅ Run migration in Supabase
2. ✅ Re-train existing bots (delete old embeddings, re-upload docs)
3. ✅ Test chat responses
4. ✅ Monitor prompt detection accuracy

## Summary

**You don't need to change your n8n workflow!** The priority system works at the database level through the `match_document_embeddings` function, which your workflow already uses.

Just run the migration and enjoy automatic prompt prioritization! 🎯
