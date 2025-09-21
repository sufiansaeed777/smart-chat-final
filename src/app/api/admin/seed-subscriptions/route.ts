import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AppDataSource } from '@/config/database';
import { Subscription } from '@/entities/Subscription';
import { User } from '@/entities/User';
import { UserRole } from '@/types/UserRole';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as { role?: string }).role;
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    const userRepository = AppDataSource.getRepository(User);
    const subscriptionRepository = AppDataSource.getRepository(Subscription);

    // Find a manager user
    let manager = await userRepository.findOne({
      where: { role: UserRole.MANAGER }
    });

    if (!manager) {
      // Create a test manager
      const newManager = userRepository.create({
        email: 'manager@manager.com',
        firstName: 'Manager',
        lastName: 'User',
        role: UserRole.MANAGER,
        isEmailVerified: true
      });
      manager = await userRepository.save(newManager);
    }

    // Clear existing subscriptions
    await subscriptionRepository.clear();

    // Create test subscriptions
    const testSubscriptions = [
      {
        managerId: manager.id,
        planName: 'Professional Plan',
        status: 'active' as const,
        amount: 99.99,
        currency: 'USD',
        billingCycle: 'monthly' as const,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        nextBillingDate: new Date('2024-02-01'),
        usersCount: 25,
        botsCount: 5,
        maxUsers: 50,
        maxBots: 10,
        notes: 'Test subscription for manager'
      },
      {
        managerId: manager.id,
        planName: 'Enterprise Plan',
        status: 'active' as const,
        amount: 299.99,
        currency: 'USD',
        billingCycle: 'yearly' as const,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        nextBillingDate: new Date('2025-01-01'),
        usersCount: 100,
        botsCount: 20,
        maxUsers: 200,
        maxBots: 50,
        notes: 'Enterprise subscription'
      }
    ];

    const createdSubscriptions = [];
    for (const subData of testSubscriptions) {
      const subscription = subscriptionRepository.create(subData);
      const savedSubscription = await subscriptionRepository.save(subscription);
      createdSubscriptions.push(savedSubscription);
    }

    return NextResponse.json({
      message: 'Test subscriptions created successfully',
      count: createdSubscriptions.length,
      subscriptions: createdSubscriptions
    });

  } catch (error) {
    console.error('Error creating test subscriptions:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
