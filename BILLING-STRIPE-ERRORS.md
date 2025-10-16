# Billing & Stripe Integration - Critical Errors Report
## Ultra-Thorough Review - December 2024

---

## 🎯 EXECUTIVE SUMMARY

**Status:** 🔴 **9 CRITICAL ERRORS FOUND - NEEDS IMMEDIATE FIXES**

**Severity Breakdown:**
- 🔴 CRITICAL (Blocking/Breaking): 5 errors
- 🟠 HIGH (Data Loss/Security): 3 errors
- 🟡 MEDIUM (Performance/UX): 1 error

---

## 🔴 CRITICAL ERROR #1: API Version Mismatch

**Severity:** 🔴 CRITICAL - Will cause webhook failures
**Files Affected:**
- `src/lib/stripe.ts:8`
- `src/app/api/stripe/webhook/route.ts:6`
- `src/app/api/stripe/create-portal-session/route.ts:8`

**Problem:**
```typescript
// stripe.ts - Line 8
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia', // ❌ Old version
});

// webhook/route.ts - Line 6
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia', // ❌ Different version!
});
```

**Impact:**
- API response structure differences
- Webhook signature verification may fail
- Type mismatches between files
- Unpredictable behavior

**Fix:**
Use the same API version everywhere:
```typescript
// All files should use:
apiVersion: '2024-12-18.acacia',
```

---

## 🔴 CRITICAL ERROR #2: String Repository Usage (TypeORM)

**Severity:** 🔴 CRITICAL - Runtime crashes
**Files Affected:**
- `src/app/api/stripe/webhook/route.ts:37`
- `src/app/api/payment/create-checkout-session/route.ts:36`
- `src/app/api/stripe/create-portal-session/route.ts:29`
- `src/app/api/webhooks/stripe/route.ts:60,61,136,193`
- `src/app/api/manager/billing/subscription/route.ts:24,25,50,51`

**Problem:**
```typescript
// ❌ WRONG - Using strings
const userRepository = AppDataSource.getRepository("users");
const botRepository = AppDataSource.getRepository("bots");
const subscriptionRepository = AppDataSource.getRepository("subscriptions");
const assignmentRepository = AppDataSource.getRepository("bot_assignments");
```

**Impact:**
- TypeORM will throw runtime errors
- All billing operations will crash
- No type safety

**Fix:**
```typescript
// ✅ CORRECT - Using Entity classes
import { User } from '@/entities/User';
import { Bot } from '@/entities/Bot';
import { Subscription } from '@/entities/Subscription';
import { BotAssignment } from '@/entities/BotAssignment';

const userRepository = AppDataSource.getRepository(User);
const botRepository = AppDataSource.getRepository(Bot);
const subscriptionRepository = AppDataSource.getRepository(Subscription);
const assignmentRepository = AppDataSource.getRepository(BotAssignment);
```

---

## 🔴 CRITICAL ERROR #3: setTimeout in Webhook Handler

**Severity:** 🔴 CRITICAL - Refunds will NEVER happen
**File:** `src/app/api/webhooks/stripe/route.ts:119-121`

**Problem:**
```typescript
// Schedule refund for 24 hours later
setTimeout(async () => {
  await handleSignupPlanRefund(session.payment_intent as string, bot.id);
}, 24 * 60 * 60 * 1000); // ❌ This will be LOST on server restart!
```

**Impact:**
- **Refunds will never be processed** if server restarts (which happens constantly in serverless)
- Users charged but never refunded
- Legal and financial liability
- Serverless functions timeout after 10 seconds anyway

**Fix:**
Use a proper job queue or database-scheduled task:
```typescript
// Option 1: Database-scheduled (simple)
await scheduleRefundInDatabase(session.payment_intent, bot.id, Date.now() + 24 * 60 * 60 * 1000);

// Option 2: Job Queue (recommended)
await refundQueue.add('process-refund', {
  paymentIntentId: session.payment_intent,
  botId: bot.id
}, {
  delay: 24 * 60 * 60 * 1000
});

// Option 3: Cron job checking database
// Run every hour, check for pending refunds
```

---

## 🟠 HIGH ERROR #4: No Webhook Idempotency

**Severity:** 🟠 HIGH - Duplicate processing
**Files:** All webhook handlers

**Problem:**
```typescript
// No idempotency check!
case 'checkout.session.completed':
  await handleCheckoutSessionCompleted(event.data.object);
  break;
```

**Impact:**
- Same event could be processed multiple times
- Duplicate bots created
- Duplicate refunds processed
- Data inconsistency

**Fix:**
```typescript
// Store processed event IDs
const processedEvents = new Set();

// Before processing
if (processedEvents.has(event.id)) {
  return NextResponse.json({ received: true, skipped: true });
}

// Or use database:
const eventRepository = AppDataSource.getRepository(WebhookEvent);
const existingEvent = await eventRepository.findOne({
  where: { stripeEventId: event.id }
});

if (existingEvent) {
  console.log('Event already processed:', event.id);
  return NextResponse.json({ received: true, skipped: true });
}

// After successful processing
await eventRepository.save({
  stripeEventId: event.id,
  type: event.type,
  processedAt: new Date()
});
```

---

## 🔴 CRITICAL ERROR #5: Missing Database Init Error Handling

**Severity:** 🔴 CRITICAL - Unhandled crashes
**Files:** All API routes

**Problem:**
```typescript
if (!AppDataSource.isInitialized) {
  await AppDataSource.initialize(); // ❌ No try-catch
}
```

**Impact:**
- Unhandled promise rejection if DB connection fails
- Server crashes
- No error message to user

**Fix:**
```typescript
if (!AppDataSource.isInitialized) {
  try {
    await AppDataSource.initialize();
  } catch (error) {
    console.error('Database initialization failed:', error);
    return NextResponse.json(
      { error: 'Database connection failed' },
      { status: 500 }
    );
  }
}
```

---

## 🟠 HIGH ERROR #6: Billing Page Uses Mock Data

**Severity:** 🟠 HIGH - No real data shown
**File:** `src/app/manager-dashboard/billing/page.tsx:32-100`

**Problem:**
```typescript
const [currentPlan] = useState({
  name: 'Professional',
  price: 99,
  period: 'month',
  features: ['Up to 50 Users', ...] // ❌ Hardcoded!
});

const [invoices] = useState([
  { id: 'INV-001', date: '2024-01-01', ... }, // ❌ Fake data!
  { id: 'INV-002', date: '2023-12-01', ... },
  // ...
]);
```

**Impact:**
- Users see fake data instead of their actual subscription
- Can't see real invoices
- Export functionality is broken
- Upgrade flow doesn't work

**Fix:**
```typescript
// Fetch real data from API
useEffect(() => {
  async function fetchBillingData() {
    const [subscriptionRes, invoicesRes] = await Promise.all([
      fetch('/api/manager/billing/subscription'),
      fetch('/api/billing/invoices')
    ]);

    const subscription = await subscriptionRes.json();
    const invoices = await invoicesRes.json();

    setCurrentPlan(subscription);
    setInvoices(invoices);
  }

  fetchBillingData();
}, []);
```

---

## 🟠 HIGH ERROR #7: No Metadata Validation in Webhooks

**Severity:** 🟠 HIGH - Potential security issue
**File:** `src/app/api/webhooks/stripe/route.ts:63-66`

**Problem:**
```typescript
const userId = session.metadata?.userId;
const planType = session.metadata?.planType;
const botName = session.metadata?.botName;

if (!userId || !botName) { // ❌ Only checks existence
  console.error('Missing required metadata');
  return;
}

// No validation of format, length, SQL injection, etc.
```

**Impact:**
- Could inject malicious data
- Buffer overflow with long strings
- Type coercion issues

**Fix:**
```typescript
const userId = session.metadata?.userId;
const planType = session.metadata?.planType;
const botName = session.metadata?.botName;

// Validate
if (!userId || !botName) {
  console.error('Missing required metadata');
  return;
}

// Sanitize and validate format
if (!/^[a-f0-9-]{36}$/i.test(userId)) {
  console.error('Invalid userId format');
  return;
}

if (botName.length > 100) {
  console.error('Bot name too long');
  return;
}

const sanitizedBotName = botName.replace(/[<>\"']/g, ''); // Basic sanitization
```

---

## 🟡 MEDIUM ERROR #8: Shipping Address for Digital Products

**Severity:** 🟡 MEDIUM - Unnecessary friction
**File:** `src/app/api/payment/create-checkout-session/route.ts:81-83`

**Problem:**
```typescript
shipping_address_collection: {
  allowed_countries: ['US', 'GB', 'CA', ...] // ❌ Why for digital product?
},
```

**Impact:**
- Forces users to enter shipping address for digital chatbot product
- Increases cart abandonment
- Confusing UX

**Fix:**
```typescript
// Remove shipping_address_collection entirely
// Only keep billing_address_collection: 'required'
```

---

## 🔴 CRITICAL ERROR #9: No Idempotency Keys in Stripe API Calls

**Severity:** 🔴 CRITICAL - Duplicate charges possible
**Files:**
- `src/app/api/payment/create-checkout-session/route.ts:51`
- `src/app/api/webhooks/stripe/route.ts:176`

**Problem:**
```typescript
// No idempotency key!
const checkoutSession = await stripe.checkout.sessions.create({
  payment_method_types: ['card', ...],
  line_items: [...],
  // ...
});

// Refund also missing idempotency key
const refund = await stripe.refunds.create({
  payment_intent: paymentIntentId,
  // ...
});
```

**Impact:**
- Network retry could create duplicate charges
- Users charged twice
- Duplicate refunds issued
- Financial and legal liability

**Fix:**
```typescript
// Generate idempotency key
const idempotencyKey = `checkout_${userId}_${Date.now()}`;

const checkoutSession = await stripe.checkout.sessions.create({
  payment_method_types: ['card', ...],
  line_items: [...],
  // ...
}, {
  idempotencyKey: idempotencyKey
});

// For refunds
const refundKey = `refund_${paymentIntentId}_${botId}`;
const refund = await stripe.refunds.create({
  payment_intent: paymentIntentId,
  reason: 'requested_by_customer',
  // ...
}, {
  idempotencyKey: refundKey
});
```

---

## 📊 SUMMARY TABLE

| # | Error | Severity | Impact | Fix Priority |
|---|-------|----------|--------|--------------|
| 1 | API Version Mismatch | 🔴 Critical | Webhook failures | Immediate |
| 2 | String Repository Usage | 🔴 Critical | All billing crashes | Immediate |
| 3 | setTimeout in Webhook | 🔴 Critical | Refunds never happen | Immediate |
| 4 | No Webhook Idempotency | 🟠 High | Duplicate processing | High |
| 5 | No DB Init Error Handling | 🔴 Critical | Server crashes | Immediate |
| 6 | Billing Page Mock Data | 🟠 High | No real data shown | High |
| 7 | No Metadata Validation | 🟠 High | Security risk | High |
| 8 | Shipping for Digital | 🟡 Medium | UX friction | Medium |
| 9 | No Idempotency Keys | 🔴 Critical | Duplicate charges | Immediate |

---

## 🚨 IMMEDIATE ACTIONS REQUIRED

### Priority 1 (MUST FIX BEFORE PRODUCTION):
1. ✅ Fix API version mismatch (all to `2024-12-18.acacia`)
2. ✅ Change all string repositories to Entity classes
3. ✅ Replace setTimeout with proper job queue/database scheduling
4. ✅ Add idempotency keys to all Stripe API calls
5. ✅ Add database init error handling

### Priority 2 (FIX SOON):
6. ✅ Implement webhook idempotency checking
7. ✅ Connect billing page to real API data
8. ✅ Add metadata validation in webhooks

### Priority 3 (IMPROVEMENT):
9. ✅ Remove shipping address collection

---

## 💡 ADDITIONAL RECOMMENDATIONS

### Security Enhancements:
- [ ] Add rate limiting to webhook endpoints
- [ ] Implement webhook replay attack prevention
- [ ] Add request signing for internal API calls
- [ ] Log all billing events to audit trail

### Reliability Improvements:
- [ ] Add retry logic for failed Stripe API calls
- [ ] Implement circuit breaker pattern
- [ ] Add comprehensive error logging
- [ ] Create alerting for failed payments

### Performance Optimizations:
- [ ] Cache subscription data (5 minute TTL)
- [ ] Batch invoice fetching
- [ ] Lazy load historical data
- [ ] Add pagination to invoice list

### Testing:
- [ ] Add unit tests for webhook handlers
- [ ] Integration tests for payment flow
- [ ] E2E tests for subscription management
- [ ] Test webhook idempotency
- [ ] Test refund scheduling

---

## 📁 FILES REQUIRING FIXES

### Critical (9 files):
1. `src/lib/stripe.ts` - API version
2. `src/app/api/stripe/webhook/route.ts` - String repo + API version
3. `src/app/api/webhooks/stripe/route.ts` - setTimeout + string repos
4. `src/app/api/payment/create-checkout-session/route.ts` - String repo + shipping
5. `src/app/api/stripe/create-portal-session/route.ts` - String repo + API version
6. `src/app/api/manager/billing/subscription/route.ts` - String repos
7. `src/app/manager-dashboard/billing/page.tsx` - Mock data
8. All webhook handlers - Idempotency
9. All Stripe API calls - Idempotency keys

---

## 🤖 Generated with [Claude Code](https://claude.com/claude-code)

**Review Date:** December 2024
**Review Type:** Ultra-Thorough Deep Dive
**Status:** 9 CRITICAL ERRORS FOUND ⚠️
