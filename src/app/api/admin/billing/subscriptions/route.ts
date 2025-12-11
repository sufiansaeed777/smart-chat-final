import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { Subscription } from '@/entities/Subscription';
import { User } from '@/entities/User';
import { UserRole } from '@/types/UserRole';

export async function GET(request: NextRequest) {
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
    const subscriptionRepository = AppDataSource.getRepository(Subscription);
    const userRepository = AppDataSource.getRepository(User);

    // Get all subscriptions with manager details
    const subscriptions = await subscriptionRepository.find({
      relations: ['manager'],
      order: { createdAt: 'DESC' }
    });

    // Transform the data for the frontend
    const formattedSubscriptions = subscriptions.map(sub => ({
      id: sub.id,
      managerId: sub.managerId,
      managerName: sub.manager ? `${sub.manager.firstName || ''} ${sub.manager.lastName || ''}`.trim() || sub.manager.email.split('@')[0] : 'Unknown Manager',
      managerEmail: sub.manager?.email || 'Unknown',
      planName: sub.planName,
      status: sub.status,
      amount: parseFloat(sub.amount.toString()),
      currency: sub.currency,
      billingCycle: sub.billingCycle,
      startDate: sub.startDate.toISOString(),
      endDate: sub.endDate.toISOString(),
      nextBillingDate: sub.nextBillingDate.toISOString(),
      usersCount: sub.usersCount,
      botsCount: sub.botsCount,
      maxUsers: sub.maxUsers,
      maxBots: sub.maxBots,
      stripeSubscriptionId: sub.stripeSubscriptionId,
      stripeCustomerId: sub.stripeCustomerId,
      notes: sub.notes,
      createdAt: sub.createdAt.toISOString(),
      updatedAt: sub.updatedAt.toISOString()
    }));

    return NextResponse.json({ subscriptions: formattedSubscriptions });

  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    const body = await request.json();
    const {
      managerId,
      planName,
      amount,
      currency = 'USD',
      billingCycle,
      startDate,
      endDate,
      nextBillingDate,
      maxUsers,
      maxBots,
      notes
    } = body;

    if (!managerId || !planName || !amount || !billingCycle || !startDate || !endDate || !nextBillingDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    const subscriptionRepository = AppDataSource.getRepository(Subscription);
    const userRepository = AppDataSource.getRepository(User);

    // Verify manager exists
    const manager = await userRepository.findOne({
      where: { id: managerId, role: UserRole.MANAGER }
    });

    if (!manager) {
      return NextResponse.json(
        { error: 'Manager not found' },
        { status: 404 }
      );
    }

    // Create new subscription
    const subscription = subscriptionRepository.create({
      managerId,
      planName,
      status: 'active',
      amount,
      currency,
      billingCycle,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      nextBillingDate: new Date(nextBillingDate),
      maxUsers: maxUsers || 0,
      maxBots: maxBots || 0,
      notes
    });

    const savedSubscription = await subscriptionRepository.save(subscription);

    return NextResponse.json({
      message: 'Subscription created successfully',
      subscription: savedSubscription
    });

  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
