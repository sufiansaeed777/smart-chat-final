import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { Subscription } from '@/entities/Subscription';
import { User } from '@/entities/User';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as { role?: string }).role;
    if (userRole !== 'manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    const subscriptionRepository = AppDataSource.getRepository("subscriptions");
    const userRepository = AppDataSource.getRepository("users");

    // Get current user
    const currentUser = await userRepository.findOne({
      where: { email: session.user.email || '' }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get manager's subscription
    const subscription = await subscriptionRepository.findOne({
      where: { managerId: currentUser.id },
      relations: ['manager']
    });

    if (!subscription) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
    }

    // Get usage statistics
    const { BotAssignment } = await import('@/entities/BotAssignment');
    const { Bot } = await import('@/entities/Bot');
    
    const assignmentRepository = AppDataSource.getRepository("bot_assignments");
    const botRepository = AppDataSource.getRepository("bots");

    // Count assigned users
    const assignedUsers = await assignmentRepository
      .createQueryBuilder('assignment')
      .leftJoin('assignment.user', 'user')
      .where('assignment.status = :status', { status: 'active' })
      .andWhere('user.invitedBy = :managerId', { managerId: currentUser.id })
      .getCount();

    // Count manager's bots
    const managerBots = await botRepository.count({
      where: { createdBy: currentUser.id }
    });

    // Update usage counts
    subscription.usersCount = assignedUsers;
    subscription.botsCount = managerBots;
    await subscriptionRepository.save(subscription);

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        planName: subscription.planName,
        status: subscription.status,
        amount: parseFloat(subscription.amount.toString()),
        currency: subscription.currency,
        billingCycle: subscription.billingCycle,
        startDate: subscription.startDate.toISOString(),
        endDate: subscription.endDate.toISOString(),
        nextBillingDate: subscription.nextBillingDate.toISOString(),
        usersCount: subscription.usersCount,
        botsCount: subscription.botsCount,
        maxUsers: subscription.maxUsers,
        maxBots: subscription.maxBots,
        stripeSubscriptionId: subscription.stripeSubscriptionId,
        stripeCustomerId: subscription.stripeCustomerId,
        notes: subscription.notes,
        createdAt: subscription.createdAt.toISOString(),
        updatedAt: subscription.updatedAt.toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching manager subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
