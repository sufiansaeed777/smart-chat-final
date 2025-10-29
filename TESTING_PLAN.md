# Smart Chat - Phase 4 Testing Plan

## Overview

This document outlines the comprehensive end-to-end testing plan for Phase 4 features before production deployment.

## Testing Environment

### Staging Setup Requirements

1. **Infrastructure:**
   - Separate staging database (PostgreSQL)
   - Staging Stripe account (test mode)
   - Staging n8n instance with test workflows
   - Staging domain: `staging.smartchat.com`

2. **Test Data:**
   - 3 test manager accounts (Free, Starter, Professional plans)
   - 5 test bots with different configurations
   - 10 sample WordPress sites (local/staging)
   - Sample training documents (PDFs, TXT files)

3. **Test Credentials:**
   ```
   Manager 1 (Free):     manager1@test.com / Test123!
   Manager 2 (Starter):  manager2@test.com / Test123!
   Manager 3 (Pro):      manager3@test.com / Test123!
   Admin:                admin@test.com / Admin123!
   ```

## Test Categories

### 1. WordPress Integration Tests

#### 1.1 Token Generation & Validation
- [ ] **TC-WP-001:** Generate WordPress token from manager dashboard
  - Navigate to Bot Settings → Integrations → WordPress
  - Click "Generate Token"
  - Verify token format: `userId:botId:secret`
  - Copy token to clipboard

- [ ] **TC-WP-002:** Validate token via API
  ```bash
  POST /api/wordpress/validate-token
  Body: { "token": "<generated-token>" }
  Expected: { "valid": true, "botId": "...", "userId": "..." }
  ```

- [ ] **TC-WP-003:** Test invalid token rejection
  ```bash
  POST /api/wordpress/validate-token
  Body: { "token": "invalid:token:here" }
  Expected: 401 Unauthorized
  ```

#### 1.2 Message Handling
- [ ] **TC-WP-004:** Send basic message
  ```bash
  POST /api/wordpress/send-message
  Body: {
    "token": "<valid-token>",
    "message": "What are your business hours?"
  }
  Expected: 200 OK with bot response
  ```

- [ ] **TC-WP-005:** Test session continuity
  - Send message 1, receive sessionId
  - Send message 2 with same sessionId
  - Verify conversation history is maintained
  - Check messages array in database

- [ ] **TC-WP-006:** Test streaming responses
  ```bash
  POST /api/wordpress/send-message
  Body: {
    "token": "<valid-token>",
    "message": "Tell me about your company",
    "metadata": { "enableStreaming": true }
  }
  Expected: SSE stream with token-by-token response
  ```

- [ ] **TC-WP-007:** Test language tracking
  ```bash
  POST /api/wordpress/send-message
  Body: {
    "token": "<valid-token>",
    "message": "Hola, ¿cómo estás?",
    "metadata": { "language": "es" }
  }
  Expected: Language saved in conversation metadata
  ```

#### 1.3 WordPress Plugin Integration
- [ ] **TC-WP-008:** Install plugin on test WordPress site
  - Upload plugin ZIP
  - Activate plugin
  - Verify no errors in WordPress debug log

- [ ] **TC-WP-009:** Configure plugin with token
  - Enter bot token in plugin settings
  - Save settings
  - Verify green "Connected" status

- [ ] **TC-WP-010:** Test widget display
  - Visit WordPress site frontend
  - Verify chat widget appears in bottom-right
  - Check widget styling and branding

- [ ] **TC-WP-011:** Test end-to-end chat flow
  - Open widget on WordPress site
  - Send message: "Hello"
  - Verify AI response appears
  - Send follow-up message
  - Verify conversation context is maintained

### 2. Rate Limiting Tests

#### 2.1 Chat Message Rate Limits
- [ ] **TC-RL-001:** Test normal usage (under limit)
  - Send 40 messages in 1 minute
  - Verify all succeed (200 OK)
  - Check X-RateLimit-Remaining header decrements

- [ ] **TC-RL-002:** Test rate limit enforcement
  - Send 51 messages in 1 minute
  - Verify 51st message gets 429 response
  - Check Retry-After header is present
  - Verify error message: "Too many requests"

- [ ] **TC-RL-003:** Test rate limit reset
  - Hit rate limit (get 429)
  - Wait for Retry-After duration
  - Send new message
  - Verify success (200 OK)

- [ ] **TC-RL-004:** Test different client isolation
  - Client A: Send 50 messages (hit limit)
  - Client B: Send message immediately after
  - Verify Client B is NOT rate limited

#### 2.2 Auth Rate Limits
- [ ] **TC-RL-005:** Test login rate limiting
  - Attempt 6 logins with wrong password
  - Verify 6th attempt gets 429 response
  - Wait 15 minutes, verify reset

#### 2.3 Training Rate Limits
- [ ] **TC-RL-006:** Test training rate limit
  - Upload 6 training batches in 1 hour
  - Verify 6th gets rate limited
  - Check limit is per-user, not global

### 3. Abuse Detection Tests

#### 3.1 SQL Injection Detection
- [ ] **TC-AB-001:** Test SQL injection patterns
  ```bash
  POST /api/wordpress/send-message
  Body: {
    "message": "'; DROP TABLE users; --"
  }
  Expected: 403 Forbidden - "Request blocked"
  ```

- [ ] **TC-AB-002:** Test UNION SELECT pattern
  ```bash
  Body: {
    "message": "1 UNION SELECT password FROM users"
  }
  Expected: 403 Forbidden
  ```

#### 3.2 XSS Detection
- [ ] **TC-AB-003:** Test script tag injection
  ```bash
  Body: {
    "message": "<script>alert('XSS')</script>"
  }
  Expected: 403 Forbidden
  ```

- [ ] **TC-AB-004:** Test event handler injection
  ```bash
  Body: {
    "message": "<img src=x onerror='alert(1)'>"
  }
  Expected: 403 Forbidden
  ```

#### 3.3 Spam Detection
- [ ] **TC-AB-005:** Test repeated identical messages
  - Send same message 5 times rapidly
  - Verify 5th message gets blocked (403)
  - Check abuse score in logs

- [ ] **TC-AB-006:** Test excessive length
  - Send message with 10,000 characters
  - Verify gets blocked
  - Check "Suspicious payload" in reason

#### 3.4 Abuse Score System
- [ ] **TC-AB-007:** Test cumulative scoring
  - Send message with SQL pattern (score +10)
  - Send repeated message (score +5)
  - Send long message (score +3)
  - Verify total score triggers block at threshold

- [ ] **TC-AB-008:** Test score decay
  - Build up abuse score
  - Wait 24 hours
  - Verify score has decayed
  - Test legitimate message succeeds

### 4. Analytics Tests

#### 4.1 Language Analytics
- [ ] **TC-AN-001:** Test language distribution
  - Create 10 conversations with different languages:
    - 5 × English (en)
    - 3 × Spanish (es)
    - 2 × French (fr)
  - Call GET /api/manager/analytics?type=languages
  - Verify response:
    ```json
    {
      "data": [
        {"language": "en", "count": 5},
        {"language": "es", "count": 3},
        {"language": "fr", "count": 2}
      ]
    }
    ```

- [ ] **TC-AN-002:** Test missing language defaults
  - Create conversation without language metadata
  - Verify defaults to "en"
  - Check appears in analytics as "en"

#### 4.2 Top Questions Analytics
- [ ] **TC-AN-003:** Test question extraction
  - Create conversations with messages:
    - "What are your hours?" × 5
    - "How do I reset password?" × 3
    - "Where are you located?" × 2
  - Call GET /api/manager/analytics?type=topQuestions
  - Verify top 10 list sorted by frequency

- [ ] **TC-AN-004:** Test question normalization
  - Send variations:
    - "What are your hours?"
    - "what are your hours"
    - "What are your hours"
  - Verify counted as same question (case-insensitive)

#### 4.3 Overview Analytics
- [ ] **TC-AN-005:** Test total users who messaged
  - Create 50 unique conversations (unique sessionIds)
  - Call GET /api/manager/overview
  - Verify totalUsers reflects unique count

- [ ] **TC-AN-006:** Test total conversations
  - Manager has 3 bots
  - Bot A: 10 conversations
  - Bot B: 5 conversations
  - Bot C: 2 conversations
  - Verify totalConversations = 17

- [ ] **TC-AN-007:** Test bot-wise analytics
  - Call GET /api/manager/bot-analytics
  - Verify per-bot breakdown:
    ```json
    {
      "botAnalytics": [
        {
          "botId": "...",
          "botName": "Support Bot",
          "conversationCount": 10,
          "messageCount": 85,
          "uniqueUsers": 8
        }
      ]
    }
    ```

### 5. Caching Tests

#### 5.1 Bot Config Caching
- [ ] **TC-CA-001:** Test cache hit
  - Clear cache
  - Make request (cache miss - DB query)
  - Make identical request within 10 minutes
  - Verify cache hit (no DB query in logs)

- [ ] **TC-CA-002:** Test cache expiration
  - Make request (cache stored)
  - Wait 11 minutes (beyond 10 min TTL)
  - Make request again
  - Verify cache miss (new DB query)

- [ ] **TC-CA-003:** Test cache invalidation on update
  - Load bot config (cached)
  - Update bot via PUT /api/manager/bot/{id}
  - Load bot config again
  - Verify sees updated data (cache invalidated)

#### 5.2 Performance Impact
- [ ] **TC-CA-004:** Measure response time improvement
  - Without cache: Measure 100 sequential requests
  - With cache: Measure 100 sequential requests
  - Verify >50% response time reduction

### 6. Streaming Response Tests

#### 6.1 SSE Functionality
- [ ] **TC-ST-001:** Test basic streaming
  - Enable streaming in metadata
  - Send message
  - Verify response Content-Type: text/event-stream
  - Verify receives multiple data events

- [ ] **TC-ST-002:** Test stream completion
  - Monitor SSE stream
  - Verify final event has `done: true`
  - Verify sessionId and conversationId in final event
  - Verify connection closes after completion

- [ ] **TC-ST-003:** Test stream error handling
  - Simulate OpenAI API error mid-stream
  - Verify client receives error event
  - Verify stream closes gracefully

#### 6.2 WordPress Widget Streaming
- [ ] **TC-ST-004:** Test widget streaming UI
  - Enable streaming in WordPress plugin settings
  - Send message from widget
  - Verify token-by-token display (typewriter effect)
  - Verify smooth user experience

### 7. Webhook Signature Tests

#### 7.1 Signature Generation
- [ ] **TC-WH-001:** Test signature creation
  ```javascript
  const payload = { test: "data" };
  const secret = "test-secret";
  const signature = generateWebhookSignature(payload, secret);
  // Verify signature is base64-encoded HMAC-SHA256
  ```

- [ ] **TC-WH-002:** Test signature verification
  ```javascript
  const valid = verifyWebhookSignature(payload, signature, secret);
  // Verify returns true for valid signature
  ```

- [ ] **TC-WH-003:** Test invalid signature rejection
  ```javascript
  const tampered = verifyWebhookSignature(payload, "wrong-sig", secret);
  // Verify returns false
  ```

#### 7.2 Stripe Webhook Signatures
- [ ] **TC-WH-004:** Test Stripe webhook validation
  - Use Stripe CLI to send test webhook
  - Verify signature is validated correctly
  - Check event is processed

- [ ] **TC-WH-005:** Test signature mismatch
  - Send webhook with invalid stripe-signature header
  - Verify 400 response
  - Verify event is NOT processed

### 8. Plan Limits & Billing Tests

#### 8.1 Message Quota Enforcement
- [ ] **TC-BL-001:** Test free plan limit (1,000 messages/month)
  - Free user: Send 1,000 messages
  - Verify all succeed
  - Send 1,001st message
  - Verify 429 with upgrade prompt

- [ ] **TC-BL-002:** Test starter plan limit (10,000 messages/month)
  - Starter user: Use 9,999 messages
  - Send message (should succeed)
  - Use 1 more (total 10,000)
  - Send another (should get 429)

- [ ] **TC-BL-003:** Test professional plan limit (100,000 messages/month)
  - Similar test for professional tier

#### 8.2 Subscription Status
- [ ] **TC-BL-004:** Test active subscription
  - User with active subscription
  - Verify can send messages normally

- [ ] **TC-BL-005:** Test past_due subscription
  - Simulate subscription past_due via Stripe
  - Attempt to send message
  - Verify 402 Payment Required
  - Verify billing URL in response

- [ ] **TC-BL-006:** Test cancelled subscription
  - Cancel subscription via Stripe portal
  - Wait for webhook processing
  - Verify downgrade to free plan
  - Verify free plan limits apply

#### 8.3 Upgrade Flow
- [ ] **TC-BL-007:** Test checkout session creation
  - Click "Upgrade" in manager dashboard
  - Verify Stripe checkout session created
  - Verify redirected to Stripe checkout

- [ ] **TC-BL-008:** Test successful payment
  - Complete Stripe checkout (test mode)
  - Verify webhook received
  - Verify user upgraded to paid plan
  - Verify new limits applied immediately

### 9. Human Handoff Tests

#### 9.1 Mode Switching
- [ ] **TC-HH-001:** Test AI to Human mode switch
  - Start conversation in AI mode
  - Manager switches to Human mode
  - Send visitor message
  - Verify NO AI response generated
  - Verify message saved, awaiting agent

- [ ] **TC-HH-002:** Test Human to AI mode switch
  - Conversation in Human mode
  - Manager switches back to AI mode
  - Send visitor message
  - Verify AI response generated

#### 9.2 Human Agent Response
- [ ] **TC-HH-003:** Test agent message sending
  - Conversation in Human mode
  - Manager sends message via PUT /api/manager/conversations/{id}
  - Verify message saved with sender: "agent"
  - Verify visitor sees message in widget

### 10. Security Tests

#### 10.1 Authentication
- [ ] **TC-SE-001:** Test unauthenticated access
  - Call manager endpoint without session
  - Verify 401 Unauthorized

- [ ] **TC-SE-002:** Test expired session
  - Login, get session
  - Wait for session expiry (24 hours)
  - Make API call
  - Verify 401, redirected to login

#### 10.2 Authorization
- [ ] **TC-SE-003:** Test cross-user access
  - User A creates bot
  - User B attempts to access bot via API
  - Verify 404 or 403

- [ ] **TC-SE-004:** Test admin-only endpoints
  - Regular user calls /api/admin/users
  - Verify 403 Forbidden

#### 10.3 SQL Injection (Database)
- [ ] **TC-SE-005:** Test parameterized queries
  - Send SQL injection in all input fields
  - Verify no DB errors in logs
  - Verify queries use parameterized statements

### 11. Performance Tests

#### 11.1 Load Testing
- [ ] **TC-PF-001:** Test concurrent messages
  - Send 100 concurrent requests
  - Verify all succeed
  - Measure average response time (<2 seconds)

- [ ] **TC-PF-002:** Test sustained load
  - Send 1,000 messages over 10 minutes
  - Monitor server resources (CPU, memory)
  - Verify no memory leaks
  - Verify response times remain consistent

#### 11.2 Database Performance
- [ ] **TC-PF-003:** Test with large dataset
  - Create 10,000 conversations in database
  - Query analytics endpoints
  - Verify response time <3 seconds
  - Check database query optimization

### 12. Error Handling Tests

#### 12.1 External Service Failures
- [ ] **TC-ER-001:** Test OpenAI API failure
  - Simulate OpenAI timeout/error
  - Verify fallback to n8n
  - Verify user gets response (not 500 error)

- [ ] **TC-ER-002:** Test n8n service failure
  - Disable n8n
  - Trained bot sends message
  - Verify fallback to OpenAI direct
  - Verify graceful degradation

- [ ] **TC-ER-003:** Test database connection loss
  - Disconnect database mid-request
  - Verify 500 error (not crash)
  - Verify error logged
  - Verify system recovers on reconnect

#### 12.2 Input Validation
- [ ] **TC-ER-004:** Test missing required fields
  - Send message without token
  - Verify 400 Bad Request with clear error

- [ ] **TC-ER-005:** Test malformed JSON
  - Send invalid JSON to endpoint
  - Verify 400 with parse error message

## Test Execution

### Prerequisites
1. Deploy to staging environment
2. Seed test data (users, bots, conversations)
3. Configure Stripe test mode
4. Set up monitoring and logging

### Execution Order
1. **Phase 1:** WordPress Integration (TC-WP-*)
2. **Phase 2:** Security (TC-RL-*, TC-AB-*, TC-SE-*)
3. **Phase 3:** Analytics (TC-AN-*)
4. **Phase 4:** Performance (TC-CA-*, TC-PF-*)
5. **Phase 5:** Billing (TC-BL-*)
6. **Phase 6:** Edge Cases (TC-ER-*)

### Test Automation

Create automated test scripts using Jest:

```bash
# Install dependencies
npm install --save-dev jest @testing-library/react supertest

# Run test suite
npm run test:e2e

# Run specific category
npm run test:e2e -- wordpress
npm run test:e2e -- security
```

### Success Criteria

- **Pass Rate:** ≥95% of all test cases must pass
- **Performance:** Average response time <2 seconds
- **Security:** Zero SQL injection vulnerabilities
- **Rate Limiting:** All limits enforced correctly
- **Billing:** All Stripe webhooks processed correctly

### Bug Reporting

For failed tests, create GitHub issues with:
- Test case ID (e.g., TC-WP-004)
- Steps to reproduce
- Expected vs actual result
- Screenshots/logs
- Environment details

### Sign-off

Before production deployment, obtain sign-off from:
- [ ] Technical Lead
- [ ] Product Owner
- [ ] QA Team
- [ ] Client (if applicable)

## Post-Testing

### Monitoring Setup
1. Set up error tracking (Sentry)
2. Configure uptime monitoring
3. Set up performance monitoring (New Relic)
4. Create alert rules for:
   - High error rates
   - Slow response times
   - Rate limit violations
   - Abuse detection triggers

### Documentation
- [ ] Update API documentation with test results
- [ ] Document known issues/limitations
- [ ] Create runbook for common issues
- [ ] Update deployment guide

## Appendix

### Test Data Generation Scripts

```bash
# Generate test conversations
npm run seed:conversations -- --count 1000

# Generate test users
npm run seed:users -- --count 50

# Clean test data
npm run clean:test-data
```

### Useful Commands

```bash
# Check rate limit status
curl -I http://localhost:3000/api/wordpress/send-message

# Monitor abuse detection
tail -f logs/abuse-detection.log | grep BLOCKED

# Check cache hit ratio
curl http://localhost:3000/api/health | jq '.cache.hitRatio'
```
