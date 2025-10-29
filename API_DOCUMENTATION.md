# Smart Chat API Documentation

This directory contains the OpenAPI 3.0 specification for the Smart Chat RAG Chatbot platform.

## Viewing the Documentation

### Option 1: Swagger UI (Recommended)

1. **Online Viewer:**
   - Go to https://editor.swagger.io/
   - Click "File" → "Import File"
   - Upload `openapi.yaml`

2. **Local Development:**
   ```bash
   # Install Swagger UI
   npm install -g swagger-ui-watcher

   # Run viewer
   swagger-ui-watcher openapi.yaml
   ```

### Option 2: Redoc

```bash
# Install Redoc CLI
npm install -g redoc-cli

# Generate HTML documentation
redoc-cli bundle openapi.yaml -o api-docs.html

# Open in browser
open api-docs.html
```

### Option 3: VS Code Extension

1. Install "OpenAPI (Swagger) Editor" extension
2. Open `openapi.yaml`
3. Right-click → "Preview Swagger"

## API Overview

### Base URLs

- **Development:** `http://localhost:3000/api`
- **Production:** `https://api.smartchat.com/api`

### Authentication

The API uses two authentication methods:

1. **Session Authentication (NextAuth)**
   - Used for: Manager, Admin, User endpoints
   - Method: HTTP-only session cookies
   - Cookie name: `next-auth.session-token`

2. **Token Authentication**
   - Used for: WordPress plugin integration
   - Format: `userId:botId:secret`
   - Header: `Authorization: userId:botId:secret`

### Rate Limiting

All endpoints implement rate limiting to prevent abuse:

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| Chat Messages | 50 | 1 minute |
| API General | 100 | 15 minutes |
| Auth Login | 5 | 15 minutes |
| Bot Training | 5 | 1 hour |

Rate limit headers are returned in responses:
```
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1640995200
```

When rate limited, you'll receive a `429 Too Many Requests` response with a `Retry-After` header.

### Abuse Detection

All message endpoints include abuse detection for:
- SQL injection attempts
- XSS (Cross-Site Scripting) attacks
- Spam patterns
- Suspicious payloads

Detected abuse results in a `403 Forbidden` response and temporary blocking.

## Key Endpoints

### 1. WordPress Integration

#### Send Message
```bash
POST /api/wordpress/send-message
Content-Type: application/json

{
  "token": "userId:botId:secret",
  "message": "What are your business hours?",
  "sessionId": "wp_1234567890_abc123",
  "metadata": {
    "enableStreaming": true,
    "language": "en"
  }
}
```

**Streaming Response:**
```bash
# Server-Sent Events (SSE)
data: {"content":"We're","done":false}

data: {"content":" open","done":false}

data: {"content":"","done":true,"sessionId":"wp_123"}
```

### 2. Bot Management

#### Create Bot
```bash
POST /api/manager/bots
Content-Type: application/json
Cookie: next-auth.session-token=<session>

{
  "name": "Customer Support Bot",
  "tone": "friendly",
  "aiModel": "gpt-3.5-turbo",
  "temperature": 0.7,
  "maxTokens": 500
}
```

#### Train Bot
```bash
POST /api/manager/train-bot
Content-Type: multipart/form-data
Cookie: next-auth.session-token=<session>

botId: <bot-uuid>
files: [file1.pdf, file2.txt]
```

### 3. Analytics

#### Get Language Distribution
```bash
GET /api/manager/analytics?type=languages
Cookie: next-auth.session-token=<session>

Response:
{
  "success": true,
  "type": "languages",
  "data": [
    {"language": "en", "count": 450},
    {"language": "es", "count": 120}
  ]
}
```

#### Get Top Questions
```bash
GET /api/manager/analytics?type=topQuestions
Cookie: next-auth.session-token=<session>

Response:
{
  "success": true,
  "type": "topQuestions",
  "data": [
    {"question": "What are your hours?", "count": 87},
    {"question": "How do I reset my password?", "count": 65}
  ]
}
```

### 4. Conversations

#### List Conversations
```bash
GET /api/manager/conversations?botId=<uuid>&mode=Human&status=active
Cookie: next-auth.session-token=<session>
```

#### Switch to Human Mode
```bash
PUT /api/manager/conversations/<conversation-id>
Content-Type: application/json
Cookie: next-auth.session-token=<session>

{
  "mode": "Human"
}
```

### 5. Billing

#### Create Checkout Session
```bash
POST /api/payment/create-checkout-session
Content-Type: application/json
Cookie: next-auth.session-token=<session>

{
  "priceId": "price_1234567890"
}

Response:
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/..."
}
```

## Error Handling

All errors follow a consistent format:

```json
{
  "error": "Error type",
  "message": "Detailed error description"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions or abuse detected |
| 404 | Not Found |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

## Webhook Signatures

For webhook endpoints (e.g., Stripe webhooks), requests are validated using HMAC signatures:

```javascript
// Signature generation
const signature = crypto
  .createHmac('sha256', secret)
  .update(JSON.stringify(payload))
  .digest('base64');

// Include in header
headers['X-Webhook-Signature'] = signature;
```

Stripe webhooks use their standard signature format with `stripe-signature` header.

## Streaming Responses (SSE)

For real-time chat experiences, enable streaming in the metadata:

```json
{
  "metadata": {
    "enableStreaming": true
  }
}
```

The response will be a Server-Sent Events stream:

```javascript
// Client-side implementation
const eventSource = new EventSource('/api/wordpress/send-message');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.done) {
    console.log('Stream complete');
    eventSource.close();
  } else {
    console.log('Token:', data.content);
    // Append to UI
  }
};
```

## Testing

### Using cURL

```bash
# Health check
curl http://localhost:3000/api/health

# Send message (WordPress)
curl -X POST http://localhost:3000/api/wordpress/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "token": "user123:bot456:secret789",
    "message": "Hello!"
  }'

# Get analytics (requires session)
curl http://localhost:3000/api/manager/analytics?type=languages \
  -H "Cookie: next-auth.session-token=<your-session>"
```

### Using Postman

1. Import `openapi.yaml` into Postman
2. Postman will auto-generate a collection with all endpoints
3. Set up environment variables for base URL and tokens

### Using JavaScript/TypeScript

```typescript
// WordPress integration
async function sendMessage(message: string) {
  const response = await fetch('/api/wordpress/send-message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      token: 'userId:botId:secret',
      message: message,
      sessionId: sessionStorage.getItem('sessionId'),
    }),
  });

  return await response.json();
}

// Manager dashboard
async function getBots() {
  const response = await fetch('/api/manager/bots', {
    credentials: 'include', // Include session cookie
  });

  return await response.json();
}
```

## Security Best Practices

1. **Never expose tokens in client-side code**
   - WordPress tokens should be generated server-side
   - Store securely in WordPress database

2. **Always use HTTPS in production**
   - Prevents token interception
   - Required for Stripe webhooks

3. **Validate webhook signatures**
   - Use provided signature utilities
   - Prevent unauthorized webhook calls

4. **Implement proper CORS**
   - Whitelist only trusted domains
   - Don't use `*` in production

5. **Monitor rate limits**
   - Implement exponential backoff
   - Cache responses when possible

## Support

For API support or questions:
- GitHub Issues: https://github.com/your-org/smart-chat/issues
- Email: support@smartchat.com
- Documentation: https://docs.smartchat.com

## Changelog

### Version 1.0.0 (Phase 4 - Current)
- ✅ Complete OpenAPI 3.0 specification
- ✅ Streaming responses (SSE)
- ✅ Rate limiting
- ✅ Abuse detection
- ✅ Language analytics
- ✅ Top questions analytics
- ✅ Bot config caching
- ✅ Signed webhooks

### Future Improvements
- WebSocket support for real-time chat
- GraphQL API alternative
- API versioning (v2)
- Enhanced analytics endpoints
- Bulk operations support
