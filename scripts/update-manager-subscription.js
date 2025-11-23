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

async function updateManagerSubscription() {
  try {
    console.log('Initializing database connection...');
    await AppDataSource.initialize();
    console.log('Database connected successfully');

    const result = await AppDataSource.query(
      `UPDATE users
       SET subscription_plan = $1,
           subscription_status = $2,
           subscription_started_at = NOW(),
           billing_cycle_start = NOW(),
           billing_cycle_end = NOW() + INTERVAL '1 month'
       WHERE email = $3
       RETURNING email, subscription_plan, subscription_status, billing_cycle_start, billing_cycle_end`,
      ['enterprise', 'active', 'manager@manager.com']
    );

    if (result.length === 0) {
      console.error('❌ Manager user not found (manager@manager.com)');
      process.exit(1);
    }

    console.log('✅ Manager subscription updated successfully!');
    console.log('Email:', result[0].email);
    console.log('Plan:', result[0].subscription_plan);
    console.log('Status:', result[0].subscription_status);
    console.log('Billing Cycle Start:', result[0].billing_cycle_start);
    console.log('Billing Cycle End:', result[0].billing_cycle_end);

    await AppDataSource.destroy();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error updating manager subscription:', error);
    await AppDataSource.destroy();
    process.exit(1);
  }
}

updateManagerSubscription();
