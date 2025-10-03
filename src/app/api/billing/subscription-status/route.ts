import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/config/database';
import { Subscription } from '@/entities/Subscription';
import { getServerSession } from 'next-auth';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Initialize database
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Get user's subscription
    const subscriptionRepository = AppDataSource.getRepository(Subscription);
    const subscription = await subscriptionRepository.findOne({
      where: { managerId: userId }
    });

    if (!subscription) {
      // No subscription = free plan
      return NextResponse.json({
        planType: 'Free',
        status: 'active',
        messageLimit: 100,
        messagesUsed: 0,
        messagesRemaining: 100,
        percentUsed: 0,
        maxBots: 1,
        botsCreated: 0,
        storageLimit: 10485760, // 10MB
        storageUsed: 0,
        isFree: true,
      });
    }

    return NextResponse.json({
      planType: subscription.planName,
      status: subscription.status,
      messageLimit: subscription.messageLimit,
      messagesUsed: subscription.messagesUsed,
      messagesRemaining: subscription.getMessagesRemaining(),
      percentUsed: Math.round((subscription.messagesUsed / subscription.messageLimit) * 100),
      maxBots: subscription.maxBots,
      botsCreated: subscription.botsCount,
      maxUsers: subscription.maxUsers,
      usersCount: subscription.usersCount,
      storageLimit: subscription.storageLimit,
      storageUsed: subscription.storageUsed,
      currentPeriodEnd: subscription.endDate,
      nextBillingDate: subscription.nextBillingDate,
      amount: subscription.amount,
      currency: subscription.currency,
      billingCycle: subscription.billingCycle,
      isActive: subscription.isActive(),
      isFree: false,
    });

  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500 }
    );
  }
}
