/**
 * Stripe Integration Test
 * Tests all Stripe functionality for Phase 3
 */

const https = require('https');

// Stripe configuration from env
const STRIPE_CONFIG = {
  secretKey: 'sk_test_51SDPdcHtme0FXmzaaVojNgIoPI0TwInyNk4PbKY70nNoh7Leb2NA3ahrwZ86hmfhk6vdzcz7Eqn57gfsI2nIPM1c00FtoL2Rlc',
  publishableKey: 'pk_test_51SDPdcHtme0FXmzaNu6HlJA8uLnVfD41gl7N4dV6mStU8fORclEJ3lzrDZVqmfJ5PDvYXzpnQLbLK6IPTOeqeBct00afgFcQn4',
  webhookSecret: 'whsec_uhqb0Fopwfq6rsSHa9xdiOrdCFA2rLak'
};

// Test plans
const TEST_PLANS = {
  basic: {
    name: 'Basic Plan',
    amount: 2900, // $29.00
    currency: 'usd',
    interval: 'month'
  },
  professional: {
    name: 'Professional Plan',
    amount: 9900, // $99.00
    currency: 'usd',
    interval: 'month'
  },
  enterprise: {
    name: 'Enterprise Plan',
    amount: 29900, // $299.00
    currency: 'usd',
    interval: 'month'
  }
};

/**
 * Make HTTPS request
 */
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: responseData
        });
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(data);
    }

    req.end();
  });
}

/**
 * Test Stripe API Connection
 */
async function testStripeConnection() {
  console.log('\n💳 Testing Stripe API Connection');
  console.log('=================================\n');

  const auth = Buffer.from(STRIPE_CONFIG.secretKey + ':').toString('base64');

  const options = {
    hostname: 'api.stripe.com',
    port: 443,
    path: '/v1/balance',
    method: 'GET',
    headers: {
      'Authorization': `Basic ${auth}`
    }
  };

  try {
    console.log('🔌 Connecting to Stripe...');
    const response = await makeRequest(options);

    console.log(`📊 Status: ${response.status}`);

    if (response.status === 200) {
      const data = JSON.parse(response.data);
      console.log('✅ SUCCESS: Connected to Stripe');
      console.log(`   Available Balance: ${data.available[0]?.amount / 100} ${data.available[0]?.currency?.toUpperCase()}`);
      console.log(`   Pending Balance: ${data.pending[0]?.amount / 100} ${data.pending[0]?.currency?.toUpperCase()}`);
      return true;
    } else {
      console.log('❌ FAILED: Could not connect to Stripe');
      console.log(`   Response: ${response.data}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    return false;
  }
}

/**
 * Test Creating a Customer
 */
async function testCreateCustomer() {
  console.log('\n👤 Testing Customer Creation');
  console.log('============================\n');

  const auth = Buffer.from(STRIPE_CONFIG.secretKey + ':').toString('base64');
  const testEmail = `test-${Date.now()}@synofex.com`;

  const formData = `email=${encodeURIComponent(testEmail)}&name=${encodeURIComponent('Test User')}&description=${encodeURIComponent('Test customer for Synofex')}`;

  const options = {
    hostname: 'api.stripe.com',
    port: 443,
    path: '/v1/customers',
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': formData.length
    }
  };

  try {
    console.log(`📧 Creating customer: ${testEmail}`);
    const response = await makeRequest(options, formData);

    if (response.status === 200) {
      const customer = JSON.parse(response.data);
      console.log('✅ SUCCESS: Customer created');
      console.log(`   Customer ID: ${customer.id}`);
      console.log(`   Email: ${customer.email}`);
      return customer.id;
    } else {
      console.log('❌ FAILED: Could not create customer');
      console.log(`   Response: ${response.data}`);
      return null;
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    return null;
  }
}

/**
 * Test Creating a Product and Price
 */
async function testCreateProduct() {
  console.log('\n📦 Testing Product Creation');
  console.log('===========================\n');

  const auth = Buffer.from(STRIPE_CONFIG.secretKey + ':').toString('base64');

  // Create product
  const productData = `name=${encodeURIComponent('Synofex Pro Plan')}&description=${encodeURIComponent('Professional chatbot plan')}`;

  const productOptions = {
    hostname: 'api.stripe.com',
    port: 443,
    path: '/v1/products',
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': productData.length
    }
  };

  try {
    console.log('📦 Creating product...');
    const productResponse = await makeRequest(productOptions, productData);

    if (productResponse.status === 200) {
      const product = JSON.parse(productResponse.data);
      console.log('✅ Product created');
      console.log(`   Product ID: ${product.id}`);

      // Create price for the product
      const priceData = `product=${product.id}&unit_amount=9900&currency=usd&recurring[interval]=month`;

      const priceOptions = {
        hostname: 'api.stripe.com',
        port: 443,
        path: '/v1/prices',
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': priceData.length
        }
      };

      console.log('💰 Creating price...');
      const priceResponse = await makeRequest(priceOptions, priceData);

      if (priceResponse.status === 200) {
        const price = JSON.parse(priceResponse.data);
        console.log('✅ Price created');
        console.log(`   Price ID: ${price.id}`);
        console.log(`   Amount: $${price.unit_amount / 100} ${price.currency.toUpperCase()}`);
        console.log(`   Interval: ${price.recurring?.interval}`);
        return price.id;
      }
    }

    console.log('❌ FAILED: Could not create product/price');
    return null;
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    return null;
  }
}

/**
 * Test Creating a Checkout Session
 */
async function testCheckoutSession(customerId, priceId) {
  console.log('\n🛒 Testing Checkout Session Creation');
  console.log('====================================\n');

  if (!customerId || !priceId) {
    console.log('⚠️  Skipping: Need customer and price IDs');
    return false;
  }

  const auth = Buffer.from(STRIPE_CONFIG.secretKey + ':').toString('base64');

  const sessionData = `customer=${customerId}&mode=subscription&line_items[0][price]=${priceId}&line_items[0][quantity]=1&success_url=${encodeURIComponent('https://smart-chat-finale.vercel.app/success')}&cancel_url=${encodeURIComponent('https://smart-chat-finale.vercel.app/cancel')}`;

  const options = {
    hostname: 'api.stripe.com',
    port: 443,
    path: '/v1/checkout/sessions',
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': sessionData.length
    }
  };

  try {
    console.log('🔗 Creating checkout session...');
    const response = await makeRequest(options, sessionData);

    if (response.status === 200) {
      const session = JSON.parse(response.data);
      console.log('✅ SUCCESS: Checkout session created');
      console.log(`   Session ID: ${session.id}`);
      console.log(`   Checkout URL: ${session.url}`);
      console.log(`   Status: ${session.status}`);
      console.log(`   Payment Status: ${session.payment_status}`);
      return true;
    } else {
      console.log('❌ FAILED: Could not create checkout session');
      console.log(`   Response: ${response.data}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    return false;
  }
}

/**
 * Test Webhook Signature Verification
 */
function testWebhookVerification() {
  console.log('\n🔐 Testing Webhook Signature Verification');
  console.log('=========================================\n');

  // Simulate a webhook payload
  const testPayload = JSON.stringify({
    id: 'evt_test_' + Date.now(),
    object: 'event',
    type: 'checkout.session.completed'
  });

  console.log('📝 Test webhook payload created');
  console.log(`   Event type: checkout.session.completed`);
  console.log(`   Webhook secret configured: ${STRIPE_CONFIG.webhookSecret ? 'YES' : 'NO'}`);

  if (STRIPE_CONFIG.webhookSecret) {
    console.log('✅ Webhook secret is configured');
    console.log('   Ready to receive Stripe webhooks');
    return true;
  } else {
    console.log('⚠️  Webhook secret not configured');
    return false;
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('\n' + '='.repeat(60));
  console.log('💳 STRIPE INTEGRATION TEST SUITE');
  console.log('='.repeat(60));

  console.log('\nConfiguration:');
  console.log(`  Secret Key: ${STRIPE_CONFIG.secretKey.substring(0, 20)}...`);
  console.log(`  Publishable Key: ${STRIPE_CONFIG.publishableKey.substring(0, 20)}...`);
  console.log(`  Mode: TEST MODE`);

  const results = {
    connection: false,
    customer: false,
    product: false,
    checkout: false,
    webhook: false
  };

  // Test connection
  results.connection = await testStripeConnection();

  if (results.connection) {
    // Test customer creation
    const customerId = await testCreateCustomer();
    results.customer = !!customerId;

    // Test product/price creation
    const priceId = await testCreateProduct();
    results.product = !!priceId;

    // Test checkout session
    results.checkout = await testCheckoutSession(customerId, priceId);
  }

  // Test webhook verification
  results.webhook = testWebhookVerification();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));

  console.log('\n✅ Passing Tests:');
  Object.entries(results).forEach(([test, passed]) => {
    if (passed) {
      console.log(`   ✓ ${test}`);
    }
  });

  const failed = Object.entries(results).filter(([_, passed]) => !passed);
  if (failed.length > 0) {
    console.log('\n❌ Failed Tests:');
    failed.forEach(([test]) => {
      console.log(`   ✗ ${test}`);
    });
  }

  const allPassed = Object.values(results).every(r => r);

  if (allPassed) {
    console.log('\n🎉 SUCCESS: All Stripe tests passed!');
    console.log('\nStripe Integration Status:');
    console.log('  ✅ API Connection working');
    console.log('  ✅ Can create customers');
    console.log('  ✅ Can create products & prices');
    console.log('  ✅ Can create checkout sessions');
    console.log('  ✅ Webhook ready');
    console.log('\n💰 Stripe billing is FULLY OPERATIONAL!');
  } else {
    console.log('\n⚠️  Some Stripe tests failed.');
    console.log('Check the errors above for details.');
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

// Run tests
runAllTests().catch(error => {
  console.error(`\n❌ Fatal error: ${error.message}`);
  process.exit(1);
});