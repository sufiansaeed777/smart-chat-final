const { DataSource } = require('typeorm');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  synchronize: false,
  logging: false,
});

async function checkManagerSubscription() {
  try {
    console.log('Initializing database connection...');
    await AppDataSource.initialize();
    console.log('Database connected successfully');

    const result = await AppDataSource.query(
      `SELECT email, subscription_plan, subscription_status,
              subscription_started_at, billing_cycle_start, billing_cycle_end,
              stripe_customer_id, stripe_subscription_id
       FROM users
       WHERE email = $1`,
      ['manager@manager.com']
    );

    if (result.length === 0) {
      console.error('❌ Manager user not found (manager@manager.com)');
    } else {
      console.log('\n📊 Manager Subscription Details:');
      console.log('Email:', result[0].email);
      console.log('Plan:', result[0].subscription_plan);
      console.log('Status:', result[0].subscription_status);
      console.log('Started At:', result[0].subscription_started_at);
      console.log('Billing Cycle Start:', result[0].billing_cycle_start);
      console.log('Billing Cycle End:', result[0].billing_cycle_end);
      console.log('Stripe Customer ID:', result[0].stripe_customer_id);
      console.log('Stripe Subscription ID:', result[0].stripe_subscription_id);
    }

    await AppDataSource.destroy();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error checking manager subscription:', error);
    await AppDataSource.destroy();
    process.exit(1);
  }
}

checkManagerSubscription();
