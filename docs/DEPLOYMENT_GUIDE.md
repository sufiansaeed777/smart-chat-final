# 🚀 Smart Chat - Complete Deployment Guide

## ✅ Current Status: READY TO DEPLOY

All code is complete. Just need to run migration and update environment variables.

---

## 📋 Pre-Deployment Checklist

### ✅ Phase 2 - WordPress Plugin & Basic Chat
- ✅ WordPress plugin created
- ✅ Floating chat widget with token authentication
- ✅ Domain binding implemented
- ✅ n8n webhook integration (needs workflow update)
- ✅ OpenAI GPT-4.1-mini integration
- ✅ Chat transcripts stored in database
- ✅ Conversation monitoring in dashboard

### ✅ Phase 3 - Document Training & Monetization
- ✅ Document upload (PDF, CSV, TXT)
- ✅ Text extraction service
- ✅ Text chunking service (RecursiveCharacterTextSplitter)
- ✅ Embedding generation (OpenAI ada-002)
- ✅ Vector storage (Supabase pgvector)
- ✅ RAG implementation
- ✅ Stripe Billing (Checkout, Portal, webhooks)
- ✅ Plan-based limits (messages, bots, storage)
- ✅ Admin dashboard for usage management

### ⚠️ Pending Deployment Steps
- [ ] Run database migration
- [ ] Update Vercel environment variables
- [ ] Update n8n workflow
- [ ] Test training flow
- [ ] Test chat with RAG

---

## 🔧 STEP 1: Run Database Migration (5 minutes)

### Option A: Using Supabase SQL Editor (Recommended)

1. **Open Supabase SQL Editor:**
   ```
   https://supabase.com/dashboard/project/aucvnpwyrbefzfiqnrvd/sql
   ```

2. **Click "New Query"**

3. **Copy the entire contents of:**
   ```
   migrations/create_document_embeddings_table.sql
   ```

4. **Paste into SQL Editor**

5. **Click "RUN" button**

6. **Verify Success:**
   - Should see: ✅ "Success. No rows returned"
   - Check Tables: You should now have `document_embeddings` table
   - Check Functions: You should have `match_document_embeddings()` function

### Option B: Using psql (Alternative)

```bash
psql postgresql://postgres:DT5X7gFAThRZNzNc@db.aucvnpwyrbefzfiqnrvd.supabase.co:5432/postgres \
  -f migrations/create_document_embeddings_table.sql
```

### Verification

Run this query to verify:
```sql
-- Check table exists
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'document_embeddings';

-- Check function exists
SELECT routine_name
FROM information_schema.routines
WHERE routine_name = 'match_document_embeddings';

-- Check extension
SELECT * FROM pg_extension WHERE extname = 'vector';
```

**Expected Results:**
- `document_embeddings` table exists ✅
- `match_document_embeddings` function exists ✅
- `vector` extension enabled ✅

---

## 🌐 STEP 2: Update Vercel Environment Variables (5 minutes)

### Go to Vercel Dashboard:
```
https://vercel.com/your-project/settings/environment-variables
```

### Add These New Variables:

```bash
# Supabase Configuration (REQUIRED for document training)
NEXT_PUBLIC_SUPABASE_URL=https://aucvnpwyrbefzfiqnrvd.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1Y3ZucHd5cmJlZnpmaXFucnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTg2ODc0MCwiZXhwIjoyMDcxNDQ0NzQwfQ.AYmWHDmBqv_bS0_9gu_DH3C-9wIogf5JivffCZqvANg
```

### Verify Existing Variables:

Make sure these are already set (they should be from previous deployment):

```bash
# Database
DATABASE_URL=postgresql://postgres.aucvnpwyrbefzfiqnrvd:DT5X7gFAThRZNzNc@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres

# OpenAI
OPENAI_API_KEY=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

# n8n
N8N_WEBHOOK_URL=https://vizterasolutions.app.n8n.cloud/webhook/chat

# Stripe (TEST MODE)
STRIPE_SECRET_KEY=sk_test_51SDPdcHtme0FXmzaaVojNgIoPI0TwInyNk4PbKY70nNoh7Leb2NA3ahrwZ86hmfhk6vdzcz7Eqn57gfsI2nIPM1c00FtoL2Rlc
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51SDPdcHtme0FXmzaNu6HlJA8uLnVfD41gl7N4dV6mStU8fORclEJ3lzrDZVqmfJ5PDvYXzpnQLbLK6IPTOeqeBct00afgFcQn4
STRIPE_WEBHOOK_SECRET=whsec_uhqb0Fopwfq6rsSHa9xdiOrdCFA2rLak

# NextAuth
NEXTAUTH_SECRET=213e23fr2D@EDFWW@ERWE
NEXTAUTH_URL=https://smart-chat-finale.vercel.app

# App URLs
NEXT_PUBLIC_APP_URL=https://smart-chat-finale.vercel.app
NEXT_PUBLIC_BASE_URL=https://smart-chat-finale.vercel.app
```

### Redeploy After Adding Variables:

```bash
# Trigger redeployment from Vercel Dashboard
# OR use CLI:
vercel --prod
```

---

## 🔄 STEP 3: Update n8n Workflow (15-20 minutes)

### What Changed:
- **OLD**: n8n handled both training AND chat
- **NEW**: n8n ONLY handles chat (training done in Next.js)

### Follow This Guide:
Open and follow: `docs/N8N_WORKFLOW_SETUP.md`

### Quick Summary:

1. **Open n8n Workflow:**
   ```
   https://vizterasolutions.app.n8n.cloud
   ```

2. **Add Supabase Credentials:**
   - URL: `https://aucvnpwyrbefzfiqnrvd.supabase.co`
   - Service Role Key: (from env-backup.txt)

3. **Configure Workflow Nodes:**
   - ✅ Webhook (trigger) - Already exists
   - ➕ OpenAI Embeddings (convert message to vector)
   - ➕ Supabase Vector Store (retrieve relevant chunks)
   - ✅ AI Agent / OpenAI Chat (generate response)
   - ➕ Postgres Chat Memory (optional)
   - ✅ Respond to Webhook (return response)

4. **Critical Configuration:**
   - Vector Store must query `document_embeddings` table
   - Use `match_document_embeddings()` function
   - Filter by `bot_id` parameter
   - Return top 5 similar chunks

5. **Test Workflow:**
   ```bash
   curl -X POST https://vizterasolutions.app.n8n.cloud/webhook/chat \
     -H "Content-Type: application/json" \
     -d '{
       "message": "What is your refund policy?",
       "chatId": "test_123",
       "botId": "test-bot-id",
       "userId": "test-user"
     }'
   ```

---

## 🧪 STEP 4: Test Training Flow (10 minutes)

### 4.1 Login to Dashboard

```
https://smart-chat-finale.vercel.app
```

### 4.2 Create a Bot

1. Go to "Manager Dashboard"
2. Click "Create New Bot"
3. Fill in details:
   - Name: "Test Bot"
   - Description: "Testing document training"
   - Domain: "test.example.com"
4. Click "Create"

### 4.3 Upload a Document

1. Go to "Knowledge Base"
2. Click "Upload Document"
3. Upload a PDF/CSV/TXT file (test with small file first)
4. Wait for upload to complete

### 4.4 Assign Document to Bot

1. Go to "Manager Bots"
2. Find your test bot
3. Click the 3-dot menu
4. Click "Add Knowledge"
5. Select the document you uploaded
6. Click "Assign"

### 4.5 Train the Bot

1. On the same bot, click 3-dot menu again
2. Click "Train Bot (n8n)"
3. **Watch the console logs** (F12 → Console tab)

**Expected Console Output:**
```
📄 Processing document: test.pdf
✅ Extracted 1234 words from test.pdf
✅ Split into 15 chunks
✅ Embedding 1/15 stored for document test.pdf
✅ Embedding 2/15 stored for document test.pdf
...
✅ Embedding 15/15 stored for document test.pdf
✅ Training completed: 15 embeddings created
```

4. **Check Bot Status:**
   - Bot status should change to "trained" ✅
   - Last trained date should be updated ✅

### 4.6 Verify in Database

```sql
-- Check embeddings were created
SELECT
  bot_id,
  document_name,
  COUNT(*) as chunk_count
FROM document_embeddings
WHERE bot_id = 'your-bot-id'
GROUP BY bot_id, document_name;
```

**Expected Result:** Should show document name and chunk count

---

## 💬 STEP 5: Test Chat with RAG (10 minutes)

### 5.1 Install WordPress Plugin

1. Download WordPress plugin (if not already installed)
2. Upload to your WordPress site
3. Activate plugin
4. Go to plugin settings

### 5.2 Configure Plugin

1. **Bot Token:** Copy from dashboard
2. **API URL:** `https://smart-chat-finale.vercel.app`
3. **Domain:** Your WordPress site domain
4. Save settings

### 5.3 Test Chat

1. Open your WordPress site in incognito/private window
2. You should see the chat widget
3. Send a message **related to your uploaded document**
   - Example: "What is your refund policy?" (if you uploaded a policy document)

**Expected Behavior:**
- Bot should respond with context from the document ✅
- Response should be relevant and specific ✅
- Response should NOT be generic ✅

### 5.4 Verify n8n Execution

1. Go to n8n Executions:
   ```
   https://vizterasolutions.app.n8n.cloud/executions
   ```

2. Find the most recent execution
3. Check each node:
   - ✅ Webhook received request
   - ✅ Embeddings generated
   - ✅ Vector search returned results (should show retrieved chunks)
   - ✅ AI generated response
   - ✅ Response sent back

---

## 💳 STEP 6: Test Stripe Payments (15 minutes)

### ✅ Stripe is Already in TEST MODE

All Stripe keys are test keys:
- `sk_test_...` - Secret key ✅
- `pk_test_...` - Publishable key ✅
- `whsec_...` - Webhook secret ✅

### 6.1 Test Checkout Flow

1. **Create a test subscription:**
   - Go to Settings → Billing
   - Click "Upgrade Plan"
   - Select "Basic Plan" ($19/month)
   - Click "Subscribe"

2. **Use Stripe Test Card:**
   ```
   Card Number: 4242 4242 4242 4242
   Expiry: Any future date (e.g., 12/25)
   CVC: Any 3 digits (e.g., 123)
   ZIP: Any 5 digits (e.g., 12345)
   ```

3. **Complete payment**

4. **Verify:**
   - You should be redirected to success page ✅
   - Your plan should be updated to "Basic" ✅
   - Stripe customer ID should be saved ✅

### 6.2 Test Stripe Webhooks

1. **Go to Stripe Dashboard:**
   ```
   https://dashboard.stripe.com/test/webhooks
   ```

2. **Configure webhook endpoint:**
   ```
   URL: https://smart-chat-finale.vercel.app/api/stripe/webhook
   Events to send:
   - checkout.session.completed
   - customer.subscription.updated
   - customer.subscription.deleted
   - invoice.payment_succeeded
   - invoice.payment_failed
   ```

3. **Get webhook signing secret:**
   - Copy the `whsec_...` value
   - Verify it matches `STRIPE_WEBHOOK_SECRET` in Vercel

4. **Test webhook:**
   - Go to Stripe Dashboard → Developers → Webhooks
   - Click on your webhook
   - Click "Send test webhook"
   - Select `checkout.session.completed`
   - Send

5. **Verify in logs:**
   - Check Vercel logs for webhook processing
   - Should see: "✅ Subscription activated for user: ..."

### 6.3 Test Customer Portal

1. **Open Customer Portal:**
   - Go to Settings → Billing
   - Click "Manage Subscription"

2. **Should redirect to Stripe Customer Portal**

3. **Test portal features:**
   - View invoices ✅
   - Update payment method ✅
   - Cancel subscription ✅
   - Download receipts ✅

### 6.4 Test Plan Limits

1. **Create a free plan user:**
   - Logout
   - Create new account
   - Don't subscribe (stays on free plan)

2. **Test message limits:**
   - Send 100 messages (free plan limit)
   - 101st message should be blocked with upgrade prompt ✅

3. **Test bot limits:**
   - Try to create 2 bots (free plan = 1 bot)
   - Should be blocked with upgrade prompt ✅

---

## 🎯 Post-Deployment Verification

### ✅ Complete Checklist

Run through this checklist after deployment:

#### Phase 2 Features
- [ ] WordPress plugin installed and configured
- [ ] Chat widget appears on WordPress site
- [ ] Messages are sent and received
- [ ] Chat transcripts visible in dashboard
- [ ] n8n webhook responds to messages
- [ ] Conversation history is stored

#### Phase 3 Features
- [ ] Document upload works (PDF, CSV, TXT)
- [ ] Documents appear in Knowledge Base
- [ ] Documents can be assigned to bots
- [ ] Training creates embeddings in database
- [ ] Bot status changes to "trained"
- [ ] Chat responses use document context (RAG works)
- [ ] Stripe checkout completes successfully
- [ ] Subscription plan is updated in database
- [ ] Stripe webhooks are processed
- [ ] Customer portal is accessible
- [ ] Plan limits are enforced (messages, bots, storage)
- [ ] Admin can view user usage stats

#### Technical
- [ ] All environment variables are set
- [ ] Database migration completed
- [ ] pgvector extension enabled
- [ ] document_embeddings table exists
- [ ] match_document_embeddings function exists
- [ ] n8n workflow updated and working
- [ ] Stripe test mode active
- [ ] No console errors on frontend
- [ ] No server errors in Vercel logs

---

## 🐛 Troubleshooting

### Training Fails

**Error: "Failed to extract text from PDF"**
- Ensure `pdf-parse` is installed: Check package.json ✅
- Check PDF is not password-protected
- Try with a different PDF

**Error: "Failed to store embedding"**
- Verify database migration ran successfully
- Check `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- Verify `document_embeddings` table exists

**Error: "OpenAI API error"**
- Check `OPENAI_API_KEY` is valid
- Verify OpenAI account has credits
- Check rate limits

### Chat Not Using Context

**Bot returns generic answers:**
- Verify bot `trainingStatus` is "trained"
- Check embeddings exist:
  ```sql
  SELECT COUNT(*) FROM document_embeddings WHERE bot_id = 'your-bot-id';
  ```
- Test n8n workflow manually
- Verify n8n has Supabase credentials configured

### Stripe Payment Fails

**Checkout doesn't complete:**
- Verify using test card: `4242 4242 4242 4242`
- Check Stripe API keys are test keys (`sk_test_`, `pk_test_`)
- Check browser console for errors

**Webhook not processing:**
- Verify webhook URL in Stripe Dashboard
- Check webhook signing secret matches env variable
- Test webhook manually in Stripe Dashboard

### n8n Workflow Issues

**Webhook times out:**
- Check n8n workflow is activated
- Verify webhook URL is correct
- Test webhook manually with curl

**Vector search returns no results:**
- Check bot has been trained
- Verify `bot_id` is passed correctly
- Lower similarity threshold (0.5 instead of 0.7)

---

## 📊 Monitoring & Logs

### Vercel Logs

```
https://vercel.com/your-project/logs
```

**What to monitor:**
- API endpoint response times
- Database connection errors
- Stripe webhook processing
- Training job progress

### Supabase Logs

```
https://supabase.com/dashboard/project/aucvnpwyrbefzfiqnrvd/logs/explorer
```

**What to monitor:**
- Database queries
- Vector search performance
- Embedding insertion errors

### n8n Execution Logs

```
https://vizterasolutions.app.n8n.cloud/executions
```

**What to monitor:**
- Webhook execution success rate
- Vector search results
- AI response generation
- Error logs

### Stripe Dashboard

```
https://dashboard.stripe.com/test/dashboard
```

**What to monitor:**
- Payment success rate
- Subscription status changes
- Webhook delivery
- Failed payments

---

## 🚀 Going Live (Production)

### When ready to go from TEST to PRODUCTION:

1. **Update Stripe Keys:**
   ```bash
   # Replace test keys with live keys:
   STRIPE_SECRET_KEY=sk_live_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_... (from live webhook)
   ```

2. **Update Stripe Webhook:**
   - Create NEW webhook in Stripe LIVE mode
   - Point to: `https://smart-chat-finale.vercel.app/api/stripe/webhook`
   - Copy NEW webhook secret
   - Update `STRIPE_WEBHOOK_SECRET` in Vercel

3. **Test with real card:**
   - Use a real credit card (will be charged!)
   - Verify payment succeeds
   - Verify subscription activates
   - Cancel test subscription

4. **Monitor for 24 hours:**
   - Watch for errors
   - Check webhook processing
   - Verify user signups work
   - Monitor payment success rate

---

## 📝 Summary

### What We Built

**Phase 2 - WordPress Plugin & Basic Chat:**
- ✅ WordPress plugin with floating widget
- ✅ Token authentication & domain binding
- ✅ n8n webhook integration
- ✅ Chat transcript storage
- ✅ Conversation monitoring

**Phase 3 - Document Training & Monetization:**
- ✅ Document upload (PDF, CSV, TXT)
- ✅ Text extraction service
- ✅ Smart text chunking (RecursiveCharacterTextSplitter)
- ✅ OpenAI embeddings (ada-002, 1536 dimensions)
- ✅ Supabase pgvector storage
- ✅ RAG implementation for context-aware responses
- ✅ Stripe Billing (Checkout, Portal, webhooks)
- ✅ Plan-based limits (messages, bots, storage)
- ✅ Admin usage dashboard

### Files Created

**Services:**
- `src/services/textExtraction.ts` - PDF/CSV/TXT extraction
- `src/services/textChunking.ts` - RecursiveCharacterTextSplitter
- `src/services/embeddingService.ts` - OpenAI + Supabase integration

**API Endpoints:**
- `src/app/api/n8n/train-bot/route.ts` - Direct document processing
- `src/app/api/stripe/webhook/route.ts` - Stripe webhook handler
- `src/app/api/stripe/create-portal-session/route.ts` - Customer portal
- `src/app/api/payment/create-checkout-session/route.ts` - Checkout

**Database:**
- `migrations/create_document_embeddings_table.sql` - pgvector schema

**Documentation:**
- `docs/TRAINING_SETUP.md` - Training system guide
- `docs/N8N_WORKFLOW_SETUP.md` - n8n configuration guide
- `docs/DEPLOYMENT_GUIDE.md` - This file

### Total Lines of Code

- **New Services:** ~474 lines
- **API Endpoints:** ~400 lines
- **Database Migration:** 89 lines
- **Documentation:** ~1,200 lines
- **Total:** ~2,163 lines

---

## ✅ You're Ready to Deploy!

**Next Steps:**
1. Run database migration (5 min)
2. Update Vercel environment variables (5 min)
3. Update n8n workflow (15 min)
4. Test training (10 min)
5. Test chat (10 min)
6. Test Stripe (15 min)

**Total Time:** ~60 minutes to full deployment

**Everything else is DONE!** 🎉
