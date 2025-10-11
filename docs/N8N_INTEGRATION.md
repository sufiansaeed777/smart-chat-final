# n8n Integration for Bot Training

This document explains how the n8n workflow automation integrates with the Smart Chat SaaS application to provide AI-powered bot training with RAG (Retrieval Augmented Generation).

## Overview

The application uses n8n to handle:
- **Document Processing**: Extract text from uploaded documents (PDFs, Google Docs)
- **Vector Embeddings**: Generate embeddings using OpenAI
- **Knowledge Storage**: Store embeddings in Supabase vector database
- **Chat Responses**: Query trained knowledge base to generate contextual responses

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Smart Chat Next.js App                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Manager Dashboard                                              │
│  ├─ Upload Documents to Bot                                    │
│  ├─ Assign Knowledge to Bot                                    │
│  └─ Click "Train Bot (n8n)" → Triggers n8n Webhook            │
│                              │                                  │
└──────────────────────────────┼──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      n8n Workflow                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Training Flow:                                                 │
│  1. Receive webhook with bot documents                          │
│  2. Download/Extract document content                           │
│  3. Split text into chunks (RecursiveCharacterTextSplitter)    │
│  4. Generate embeddings (OpenAI)                                │
│  5. Store in Supabase Vector Store                             │
│                                                                 │
│  Chat Flow:                                                     │
│  1. Receive chat message via webhook                            │
│  2. Query vector store for relevant documents                   │
│  3. Load conversation history from Postgres                     │
│  4. Generate AI response (GPT-4 with context)                   │
│  5. Return response                                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase + OpenAI                            │
├─────────────────────────────────────────────────────────────────┤
│  - Vector embeddings stored in Supabase                         │
│  - Chat memory in Postgres                                      │
│  - OpenAI for embeddings + GPT-4 responses                      │
└─────────────────────────────────────────────────────────────────┘
```

## Setup Instructions

### 1. Import n8n Workflow

1. Open your n8n instance
2. Go to **Workflows** → **Import from File**
3. Upload `/AI_Chatbot.json` from the project root
4. The workflow will be created with all nodes

### 2. Configure Credentials

The workflow requires these credentials:

#### OpenAI API
- Go to [OpenAI Platform](https://platform.openai.com/api-keys)
- Create an API key
- Add to n8n: **Credentials** → **OpenAI** → Paste API key

#### Supabase
- Go to your Supabase project settings
- Copy **Project URL** and **Service Role Key**
- Add to n8n: **Credentials** → **Supabase** → Enter URL and Key

#### Postgres (for chat memory)
- Use your Supabase Postgres connection string
- Add to n8n: **Credentials** → **Postgres** → Enter connection details

#### Google Drive (optional)
- For auto-sync of documents from Google Drive
- Set up OAuth2 credentials in Google Cloud Console
- Add to n8n: **Credentials** → **Google Drive OAuth2**

### 3. Configure Webhook URLs

1. In the n8n workflow, find the **Webhook** node
2. Copy the **Production Webhook URL**
3. Add to your `.env.local`:

```bash
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/c724f29c-cc20-4409-90c2-d4a494ad3e41
N8N_API_KEY=your_api_key_here  # Optional, for authentication
```

### 4. Update Vector Store Configuration

In the n8n workflow:

1. **Supabase Vector Store** nodes:
   - Table name: `documents` (for training)
   - Query name: `match_documents`

2. **Postgres Chat Memory** node:
   - Table name: `n8n_chat_histories`
   - Context window: 10 messages

### 5. Run Database Migration

Apply the migration to add training fields to the `bots` table:

```bash
# Using psql
psql $DATABASE_URL -f migrations/add_n8n_training_fields.sql

# Or using Supabase SQL Editor
# Copy contents of migrations/add_n8n_training_fields.sql
# Paste into SQL Editor and execute
```

## Usage

### Training a Bot

1. **Upload Documents**:
   - Go to **Manager Dashboard** → **Bots**
   - Click 3 dots menu → **Assign Knowledge**
   - Select documents to assign

2. **Train Bot**:
   - Click 3 dots menu → **Train Bot (n8n)**
   - System sends all assigned documents to n8n
   - n8n processes and creates vector embeddings
   - Training status updates to "trained"

3. **Verify Training**:
   - Check bot status in dashboard
   - `trainingStatus` should be "trained"
   - `lastTrainedAt` shows timestamp

### Chat with Trained Bot

Once trained, users can chat with the bot:

```typescript
// Example: Send message to trained bot
const response = await fetch('/api/chat/send', {
  method: 'POST',
  body: JSON.stringify({
    botId: 'bot-uuid',
    message: 'What is your refund policy?',
    userId: 'user-uuid',
  })
});
```

The bot will:
1. Query the vector store for relevant documents
2. Use conversation history for context
3. Generate an AI response with relevant knowledge

## API Endpoints

### POST `/api/n8n/train-bot`

Trigger training for a bot.

**Request:**
```json
{
  "botId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Trained 3/3 documents",
  "botId": "uuid",
  "documentsProcessed": 3,
  "trainingStatus": "trained",
  "results": [
    { "documentId": "doc1", "success": true },
    { "documentId": "doc2", "success": true },
    { "documentId": "doc3", "success": true }
  ]
}
```

## Database Schema

### Bot Entity (Enhanced)

```typescript
{
  // ... existing fields

  // n8n Training Fields
  trainingStatus: 'untrained' | 'training' | 'trained' | 'training_failed',
  lastTrainedAt: Date | null,
  n8nWebhookUrl: string | null,  // Bot-specific webhook
  trainingLog: string | null      // JSON log
}
```

## Troubleshooting

### Training Fails

1. **Check n8n webhook URL**:
   - Verify `N8N_WEBHOOK_URL` in `.env.local`
   - Test webhook manually with cURL

2. **Check credentials**:
   - OpenAI API key valid and has credits
   - Supabase credentials correct
   - Postgres connection working

3. **Check logs**:
   - View n8n execution logs
   - Check Next.js console for errors
   - Review bot's `trainingLog` field

### Bot Returns Generic Responses

1. **Verify training status**:
   - Check `trainingStatus` is "trained"
   - Verify documents in vector store

2. **Check vector store**:
   - Query Supabase `documents` table
   - Verify embeddings exist

3. **Test retrieval**:
   - Use n8n "Test Workflow" to verify retrieval

## Advanced Configuration

### Custom Training Parameters

Edit the n8n workflow to adjust:

- **Chunk size**: Recursive Character Text Splitter (default: 1000)
- **Chunk overlap**: Default 100 characters
- **Embedding model**: Default `text-embedding-ada-002`
- **Chat model**: Default `gpt-4.1-mini`
- **Temperature**: Default 0.7

### Google Drive Auto-Sync

The workflow includes Google Drive triggers:

1. **File Created** - Automatically processes new files
2. **File Updated** - Reprocesses updated files

Configure the folder ID in the trigger nodes.

## Cost Considerations

### OpenAI Costs

- **Embeddings**: ~$0.0001 per 1K tokens
- **GPT-4 Chat**: ~$0.03 per 1K tokens (input), ~$0.06 per 1K tokens (output)

### Optimization Tips

1. **Batch training**: Train multiple documents at once
2. **Cache embeddings**: Don't retrain unless document changes
3. **Use GPT-3.5**: Cheaper alternative for simple queries
4. **Limit context**: Reduce chunk size to save tokens

## Support

For issues:
1. Check n8n execution logs
2. Review Next.js console
3. Verify all credentials
4. Test webhook connectivity

## Updates

- **2025-10-11**: Initial n8n integration implementation
- Added training status tracking
- Implemented batch training API
- Created migration for new database fields
