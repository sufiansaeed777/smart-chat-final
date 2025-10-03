# WordPress Integration - Manual Testing Guide

## Prerequisites
✅ Server running: `npm run dev` (on http://localhost:3000)
✅ You have a bot created in the dashboard

---

## Step 1: Get Your Bot Token

### Option A: From Database (Quick)
```bash
node -e "
const pg = require('pg');
require('dotenv').config({ path: '.env.local' });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
pool.query(\"SELECT b.id as bot_id, b.name, b.domain, u.id as user_id FROM bots b JOIN users u ON b.\\\"createdBy\\\" = u.id WHERE b.status = 'active' LIMIT 1\")
  .then(res => {
    if (res.rows.length > 0) {
      const bot = res.rows[0];
      const token = \`\${bot.user_id}:\${bot.bot_id}:wordpress-secret\`;
      console.log('Bot Name:', bot.name);
      console.log('Bot ID:', bot.bot_id);
      console.log('Domain:', bot.domain);
      console.log('\\nYour Token:', token);
    } else {
      console.log('No bots found');
    }
    pool.end();
  });
"
```

### Option B: From Dashboard (Manual)
1. Go to http://localhost:3000/manager-dashboard
2. Click on any bot
3. Look for "WordPress Token" or "API Token"
4. Copy the token

---

## Step 2: Test WordPress API Endpoints

### Test 1: Validate Token (Using curl)

**Replace `YOUR_TOKEN_HERE` with your actual token:**

```bash
curl -X POST http://localhost:3000/api/wordpress/validate-token \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_TOKEN_HERE",
    "domain": "localhost"
  }'
```

**Expected Response (Success):**
```json
{
  "valid": true,
  "bot": {
    "id": "...",
    "name": "Property Sales",
    "welcomeMessage": "Hello! How can I help you?",
    "primaryColor": "#0066FF",
    ...
  }
}
```

**Expected Response (Invalid Token):**
```json
{
  "valid": false,
  "error": "Invalid token format"
}
```

---

### Test 2: Send Message (Using curl)

**Replace `YOUR_BOT_ID` with your bot ID:**

```bash
curl -X POST http://localhost:3000/api/wordpress/send-message-v2 \
  -H "Content-Type: application/json" \
  -d '{
    "botId": "YOUR_BOT_ID",
    "message": "Hello from WordPress test!",
    "userId": "test-user-123",
    "sessionId": "test-session-456"
  }'
```

**Expected Response (Success):**
```json
{
  "success": true,
  "response": "Hello! How can I assist you today?",
  "sessionId": "test-session-456"
}
```

---

### Test 3: Check CORS Headers

```bash
curl -X OPTIONS http://localhost:3000/api/wordpress/validate-token -v
```

**Expected:** Should see headers like:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, OPTIONS
```

---

## Step 3: Test with Browser Console (Alternative)

1. Open http://localhost:3000 in browser
2. Open Developer Console (F12)
3. Paste this code (replace YOUR_TOKEN_HERE):

```javascript
// Test 1: Validate Token
fetch('http://localhost:3000/api/wordpress/validate-token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    token: 'YOUR_TOKEN_HERE',
    domain: 'localhost'
  })
})
.then(r => r.json())
.then(data => console.log('✅ Validate Token:', data));

// Test 2: Send Message
fetch('http://localhost:3000/api/wordpress/send-message-v2', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    botId: 'YOUR_BOT_ID',
    message: 'Hello!',
    userId: 'test-123',
    sessionId: 'session-123'
  })
})
.then(r => r.json())
.then(data => console.log('✅ Send Message:', data));
```

---

## Step 4: Test WordPress Plugin (If you have WordPress)

### A. Install Plugin

1. **Download plugin:**
   - File is located at: `wordpress-plugin/synofex-chatbot-fixed.zip`
   - Or zip the folder: `wordpress-plugin/synofex-chatbot/`

2. **Upload to WordPress:**
   - Go to WordPress Admin → Plugins → Add New
   - Click "Upload Plugin"
   - Choose `synofex-chatbot-fixed.zip`
   - Click "Install Now"
   - Click "Activate"

### B. Configure Plugin

1. **Go to Settings → Synofex Chatbot**

2. **Enter Configuration:**
   ```
   API URL: http://localhost:3000
   (For production: https://your-domain.com)

   Auth Token: YOUR_TOKEN_HERE
   (Get from Step 1 above)

   Bot Domain: your-wordpress-site.com
   (Or localhost for testing)
   ```

3. **Save Settings**

### C. Test on WordPress Site

1. **Visit your WordPress homepage**
2. **Look for chatbot widget** (bottom-right corner)
3. **Click to open chat**
4. **Type a message**
5. **Should get AI response!**

---

## Step 5: Test with Shortcode (Optional)

Add this to any WordPress page/post:

```
[synofex_chatbot]
```

The chatbot should appear inline on that page.

---

## ✅ Success Checklist

Mark these off as you test:

```
□ Server is running on http://localhost:3000
□ Got bot token from database or dashboard
□ Test 1: Validate Token API - Returns valid: true
□ Test 2: Send Message API - Returns AI response
□ Test 3: CORS headers present
□ (Optional) Plugin installed on WordPress
□ (Optional) Plugin configured with token
□ (Optional) Chatbot appears on WordPress site
□ (Optional) Chat messages work on WordPress
```

---

## 🐛 Troubleshooting

**Token validation fails?**
- Check token format: `user_id:bot_id:secret`
- Make sure bot status is "active"
- Check domain matches

**No response from chat?**
- Check OpenAI API key in .env.local
- Check server logs for errors
- Verify bot ID is correct

**Plugin doesn't appear on WordPress?**
- Check WordPress footer (widget auto-loads)
- Try shortcode: `[synofex_chatbot]`
- Check browser console for JS errors

**CORS errors?**
- API should have CORS headers
- Check API URL in plugin settings
- Try without https if testing locally

---

## 📋 Quick Copy-Paste Commands

**Get Token:**
```bash
cd smart-chat-main
node -e "const pg=require('pg');require('dotenv').config({path:'.env.local'});const p=new pg.Pool({connectionString:process.env.DATABASE_URL});p.query('SELECT b.id as bot_id,u.id as user_id,b.name FROM bots b JOIN users u ON b.\"createdBy\"=u.id WHERE b.status=\\'active\\' LIMIT 1').then(r=>{if(r.rows[0]){const b=r.rows[0];console.log('Token:',b.user_id+':'+b.bot_id+':wordpress-secret')}p.end()})"
```

**Test Validate Token:**
```bash
curl -X POST http://localhost:3000/api/wordpress/validate-token \
  -H "Content-Type: application/json" \
  -d '{"token":"PASTE_TOKEN_HERE","domain":"localhost"}'
```

**Test Send Message:**
```bash
curl -X POST http://localhost:3000/api/wordpress/send-message-v2 \
  -H "Content-Type: application/json" \
  -d '{"botId":"PASTE_BOT_ID","message":"Hi","userId":"test","sessionId":"test"}'
```

---

## 🎉 That's it!

If all tests pass, WordPress integration is working perfectly! ✅
