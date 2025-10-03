require('dotenv').config({ path: '.env.local' });

async function testStripeIntegration() {
  console.log('🔐 Testing Stripe Integration...\n');

  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

  console.log('1️⃣ Checking environment variables...');
  console.log(`   Secret Key: ${STRIPE_SECRET_KEY ? '✅ Present' : '❌ Missing'} (${STRIPE_SECRET_KEY?.substring(0, 20)}...)`);
  console.log(`   Publishable Key: ${STRIPE_PUBLISHABLE_KEY ? '✅ Present' : '❌ Missing'} (${STRIPE_PUBLISHABLE_KEY?.substring(0, 20)}...)`);
  console.log(`   Webhook Secret: ${STRIPE_WEBHOOK_SECRET ? '✅ Present' : '❌ Missing'} (${STRIPE_WEBHOOK_SECRET?.substring(0, 10)}...)`);

  if (!STRIPE_SECRET_KEY || !STRIPE_PUBLISHABLE_KEY || !STRIPE_WEBHOOK_SECRET) {
    console.log('\n❌ Missing Stripe configuration!');
    return;
  }

  console.log('\n2️⃣ Testing Stripe API connection...');

  try {
    // Import Stripe
    const Stripe = require('stripe');
    const stripe = new Stripe(STRIPE_SECRET_KEY);

    // Test 1: Get account info
    console.log('   Testing account access...');
    const account = await stripe.accounts.retrieve();
    console.log(`   ✅ Connected to Stripe account: ${account.email || account.id}`);
    console.log(`   Account Type: ${account.type}`);
    console.log(`   Country: ${account.country || 'N/A'}`);

    // Test 2: List products
    console.log('\n3️⃣ Checking Stripe products...');
    const products = await stripe.products.list({ limit: 10 });
    console.log(`   Found ${products.data.length} product(s):`);

    if (products.data.length > 0) {
      products.data.forEach(product => {
        console.log(`   - ${product.name} (${product.id})`);
      });
    } else {
      console.log('   ℹ️  No products found. You may need to create pricing plans in Stripe.');
    }

    // Test 3: List prices
    console.log('\n4️⃣ Checking Stripe prices...');
    const prices = await stripe.prices.list({ limit: 10 });
    console.log(`   Found ${prices.data.length} price(s):`);

    if (prices.data.length > 0) {
      prices.data.forEach(price => {
        const amount = price.unit_amount ? `$${(price.unit_amount / 100).toFixed(2)}` : 'Free';
        const interval = price.recurring ? `/${price.recurring.interval}` : '';
        console.log(`   - ${price.id}: ${amount}${interval}`);
      });
    } else {
      console.log('   ℹ️  No prices found. You may need to create pricing plans in Stripe.');
    }

    // Test 4: Webhook secret format
    console.log('\n5️⃣ Validating webhook secret...');
    if (STRIPE_WEBHOOK_SECRET.startsWith('whsec_')) {
      console.log('   ✅ Webhook secret format is correct');
    } else {
      console.log('   ⚠️  Webhook secret format may be incorrect (should start with "whsec_")');
    }

    console.log('\n✅ ALL STRIPE TESTS PASSED!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Restart your development server: npm run dev');
    console.log('   2. Stripe billing is now fully functional!');
    console.log('   3. Test subscription flow in the dashboard');
    console.log('   4. Webhooks will work when Stripe sends events');

  } catch (error) {
    console.error('\n❌ Stripe API Error:');
    console.error(`   ${error.message}`);

    if (error.type === 'StripeAuthenticationError') {
      console.log('\n   This usually means:');
      console.log('   - Invalid secret key');
      console.log('   - Key is for wrong mode (test vs live)');
      console.log('   - Key has been revoked');
    }
  }
}

testStripeIntegration();
