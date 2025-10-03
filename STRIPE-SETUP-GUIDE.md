# Stripe Setup Guide

## Current Status
✅ Stripe integration code is complete
✅ Billing page with customer portal button
✅ Pricing page with checkout buttons
✅ Webhooks configured
❌ **Need to create products and prices in Stripe**

## Step 1: Create Products in Stripe Dashboard

1. Go to https://dashboard.stripe.com/test/products
2. Click "**+ Add product**" button
3. Create 3 products with these details:

### Product 1: Starter Plan
- **Name**: Starter Plan
- **Description**: For freelancers & small businesses
- **Pricing**:
  - Price: $19
  - Billing period: Monthly
  - After creating, copy the **Price ID** (starts with `price_`)

### Product 2: Pro Plan
- **Name**: Pro Plan
- **Description**: For agencies & e-commerce
- **Pricing**:
  - Price: $49
  - Billing period: Monthly
  - After creating, copy the **Price ID** (starts with `price_`)

### Product 3: Enterprise Plan
- **Name**: Enterprise Plan
- **Description**: For large businesses & SaaS
- **Pricing**:
  - Price: $99
  - Billing period: Monthly
  - After creating, copy the **Price ID** (starts with `price_`)

## Step 2: Update Price IDs in Code

After creating the products, update the `stripePriceId` values in:

`src/app/pricing/page.tsx` (lines 258, 281, 306):

```typescript
{
  name: "Starter",
  stripePriceId: 'price_XXXXXXXXXXXX', // Replace with your Stripe Price ID
  // ...
},
{
  name: "Pro",
  stripePriceId: 'price_XXXXXXXXXXXX', // Replace with your Stripe Price ID
  // ...
},
{
  name: "Enterprise",
  stripePriceId: 'price_XXXXXXXXXXXX', // Replace with your Stripe Price ID
  // ...
}
```

## Step 3: Configure Stripe Webhook (Important!)

The client already configured the Customer Portal, but you need to set up webhooks:

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click "**+ Add endpoint**"
3. Set endpoint URL: `https://your-domain.com/api/webhooks/stripe`
   - For local testing: Use ngrok or similar tunnel service
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the **Webhook signing secret** (starts with `whsec_`)
6. Add to `.env.local`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXX
   ```

## Step 4: Test the Flow

### Testing Subscription Checkout:

1. **Go to pricing page**: http://localhost:3000/pricing
2. **Click "Start Free Trial"** on any paid plan
3. **You'll be redirected to Stripe Checkout**
4. **Use test card**:
   - Card number: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., 12/25)
   - CVC: Any 3 digits (e.g., 123)
   - ZIP: Any 5 digits (e.g., 12345)
5. **Complete checkout**
6. **You'll be redirected back** to your app
7. **Webhook will create subscription** in your database

### Testing Customer Portal:

1. **Go to billing page**: http://localhost:3000/manager-dashboard/billing
2. **Click "Manage Billing"** button
3. **You'll be redirected to Stripe Customer Portal** (the one the client configured)
4. **You can**:
   - Update payment method
   - View invoices
   - Cancel subscription
   - Update billing info

## Step 5: Verify Everything Works

After a successful test purchase:

**Check Database:**
```sql
SELECT * FROM subscriptions WHERE "managerId" = 'your-user-id';
```

**Check Stripe Dashboard:**
- Go to https://dashboard.stripe.com/test/subscriptions
- You should see your test subscription

**Check Billing Page:**
- Should show your active subscription
- Should show "Manage Billing" button
- Should show usage stats

## Common Test Cards

Stripe provides test cards for different scenarios:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Authentication (3D Secure)**: `4000 0025 0000 3155`
- **Insufficient Funds**: `4000 0000 0000 9995`

## Moving to Production

When ready for production:

1. Switch from Test mode to Live mode in Stripe dashboard
2. Create products again in Live mode
3. Update Price IDs in code with Live Price IDs
4. Update `.env.local` with Live API keys:
   ```
   STRIPE_SECRET_KEY=sk_live_XXXXXXXXXXXX
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_XXXXXXXXXXXX
   STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXX (from live webhook)
   ```
5. Update webhook endpoint URL to production domain
6. Test thoroughly before launch!

## Troubleshooting

**Button doesn't work?**
- Check browser console for errors
- Make sure you're logged in
- Check if Stripe API keys are set in `.env.local`

**Checkout session fails?**
- Verify Price ID is correct (copy-paste from Stripe dashboard)
- Check server logs for errors
- Make sure Stripe secret key is valid

**Webhook not working?**
- Verify webhook secret is correct
- Check webhook endpoint is accessible
- Use Stripe CLI for local testing: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

**Subscription not showing in database?**
- Check webhook logs in Stripe dashboard
- Verify database connection
- Check server logs for webhook processing errors

---

## Summary

**What's working now:**
- ✅ Click "Start Free Trial" → Opens Stripe Checkout
- ✅ Complete payment → Webhook creates subscription
- ✅ Click "Manage Billing" → Opens Stripe Customer Portal
- ✅ Customer can manage subscription, payment methods, invoices

**What you need to do:**
1. Create 3 products in Stripe (Starter, Pro, Enterprise)
2. Copy Price IDs and update in `pricing/page.tsx`
3. Set up webhook endpoint
4. Test with test card `4242 4242 4242 4242`
5. Verify subscription appears in database and billing page

**That's it! Your Stripe integration is complete!** 🎉
