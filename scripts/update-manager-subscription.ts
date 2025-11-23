import { AppDataSource } from '../src/config/database';
import { User } from '../src/entities/User';

async function updateManagerSubscription() {
  try {
    console.log('Initializing database connection...');

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('Database connected successfully');

    const userRepository = AppDataSource.getRepository(User);

    // Find the manager user
    const manager = await userRepository.findOne({
      where: { email: 'manager@manager.com' }
    });

    if (!manager) {
      console.error('❌ Manager user not found (manager@manager.com)');
      process.exit(1);
    }

    console.log('Found manager user:', manager.email);

    // Update subscription to Enterprise
    const now = new Date();
    const billingCycleEnd = new Date(now);
    billingCycleEnd.setMonth(billingCycleEnd.getMonth() + 1);

    manager.subscriptionPlan = 'enterprise';
    manager.subscriptionStatus = 'active';
    manager.subscriptionStartedAt = now;
    manager.billingCycleStart = now;
    manager.billingCycleEnd = billingCycleEnd;

    await userRepository.save(manager);

    console.log('✅ Manager subscription updated successfully!');
    console.log('Plan:', manager.subscriptionPlan);
    console.log('Status:', manager.subscriptionStatus);
    console.log('Billing Cycle:', manager.billingCycleStart, 'to', manager.billingCycleEnd);

    await AppDataSource.destroy();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error updating manager subscription:', error);
    process.exit(1);
  }
}

updateManagerSubscription();
