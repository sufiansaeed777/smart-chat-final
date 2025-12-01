import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';

// Plan pricing configuration
const PLAN_PRICING = {
  free: { monthly: 0, yearly: 0, maxBots: 1, maxUsers: 1, messagesLimit: 100 },
  starter: { monthly: 29, yearly: 290, maxBots: 3, maxUsers: 5, messagesLimit: 1000 },
  professional: { monthly: 79, yearly: 790, maxBots: 10, maxUsers: 20, messagesLimit: 5000 },
  enterprise: { monthly: 199, yearly: 1990, maxBots: 50, maxUsers: 100, messagesLimit: 50000 }
};

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as { role?: string }).role;
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      userId,
      planName,
      subscriptionStatus = 'active',
      billingCycle = 'monthly',
      customAmount,
      notes,
      resetUsage = false
    } = body;

    if (!userId || !planName) {
      return NextResponse.json(
        { error: 'User ID and plan name are required' },
        { status: 400 }
      );
    }

    if (!['free', 'starter', 'professional', 'enterprise'].includes(planName)) {
      return NextResponse.json(
        { error: 'Invalid plan name' },
        { status: 400 }
      );
    }

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const userRepository = AppDataSource.getRepository('users');
    const subscriptionRepository = AppDataSource.getRepository('subscriptions');

    // Find the user
    const user = await userRepository.findOne({ where: { id: userId } });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const previousPlan = user.subscriptionPlan;
    const isUpgrade = getPlanLevel(planName) > getPlanLevel(previousPlan);
    const isDowngrade = getPlanLevel(planName) < getPlanLevel(previousPlan);

    // Calculate billing dates
    const now = new Date();
    const billingCycleEnd = new Date(now);
    if (billingCycle === 'monthly') {
      billingCycleEnd.setMonth(billingCycleEnd.getMonth() + 1);
    } else {
      billingCycleEnd.setFullYear(billingCycleEnd.getFullYear() + 1);
    }

    // Get plan pricing
    const planConfig = PLAN_PRICING[planName as keyof typeof PLAN_PRICING];
    const amount = customAmount !== undefined ? customAmount :
      (billingCycle === 'monthly' ? planConfig.monthly : planConfig.yearly);

    // Update user's subscription fields
    const userUpdates: any = {
      subscriptionPlan: planName,
      subscriptionStatus: subscriptionStatus,
      subscriptionStartedAt: now,
      billingCycleStart: now,
      billingCycleEnd: billingCycleEnd
    };

    // Reset usage if requested or if upgrading
    if (resetUsage || isUpgrade) {
      userUpdates.messagesUsedThisMonth = 0;
    }

    // Clear subscription end date if activating
    if (subscriptionStatus === 'active') {
      userUpdates.subscriptionEndedAt = null;
    }

    await userRepository.update(userId, userUpdates);

    // Check if user is a manager - if so, also update/create subscription record
    if (user.role === 'manager') {
      // Check for existing subscription
      const existingSubscription = await subscriptionRepository.findOne({
        where: { managerId: userId }
      });

      if (existingSubscription) {
        // Update existing subscription
        await subscriptionRepository.update(existingSubscription.id, {
          planName: planName.charAt(0).toUpperCase() + planName.slice(1),
          status: subscriptionStatus,
          amount: amount,
          billingCycle: billingCycle,
          startDate: now,
          endDate: billingCycleEnd,
          nextBillingDate: billingCycleEnd,
          maxUsers: planConfig.maxUsers,
          maxBots: planConfig.maxBots,
          notes: notes || `Plan ${isUpgrade ? 'upgraded' : isDowngrade ? 'downgraded' : 'changed'} by admin`
        });
      } else if (planName !== 'free') {
        // Create new subscription for paid plans
        const newSubscription = subscriptionRepository.create({
          managerId: userId,
          planName: planName.charAt(0).toUpperCase() + planName.slice(1),
          status: subscriptionStatus,
          amount: amount,
          currency: 'USD',
          billingCycle: billingCycle,
          startDate: now,
          endDate: billingCycleEnd,
          nextBillingDate: billingCycleEnd,
          maxUsers: planConfig.maxUsers,
          maxBots: planConfig.maxBots,
          usersCount: 0,
          botsCount: 0,
          notes: notes || 'Plan assigned by admin'
        });
        await subscriptionRepository.save(newSubscription);
      }
    }

    // Fetch updated user
    const updatedUser = await userRepository.findOne({ where: { id: userId } });

    return NextResponse.json({
      success: true,
      message: `Plan ${isUpgrade ? 'upgraded' : isDowngrade ? 'downgraded' : 'assigned'} successfully`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        subscriptionPlan: updatedUser.subscriptionPlan,
        subscriptionStatus: updatedUser.subscriptionStatus,
        billingCycleStart: updatedUser.billingCycleStart,
        billingCycleEnd: updatedUser.billingCycleEnd,
        messagesUsedThisMonth: updatedUser.messagesUsedThisMonth
      },
      previousPlan,
      newPlan: planName,
      isUpgrade,
      isDowngrade
    });

  } catch (error) {
    console.error('Error assigning plan:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Helper function to determine plan level for upgrade/downgrade detection
function getPlanLevel(plan: string): number {
  const levels: { [key: string]: number } = {
    'free': 0,
    'starter': 1,
    'professional': 2,
    'enterprise': 3
  };
  return levels[plan.toLowerCase()] || 0;
}

// GET all users with their subscription info for the dropdown
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as { role?: string }).role;
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || 'all';

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const userRepository = AppDataSource.getRepository('users');

    let query = userRepository.createQueryBuilder('user')
      .select([
        'user.id',
        'user.email',
        'user.firstName',
        'user.lastName',
        'user.role',
        'user.subscriptionPlan',
        'user.subscriptionStatus',
        'user.messagesUsedThisMonth',
        'user.billingCycleStart',
        'user.billingCycleEnd',
        'user.isActive'
      ]);

    if (search) {
      query = query.where(
        '(user.email ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (role !== 'all') {
      query = query.andWhere('user.role = :role', { role });
    }

    query = query.orderBy('user.createdAt', 'DESC').take(50);

    const users = await query.getMany();

    return NextResponse.json({
      success: true,
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email.split('@')[0],
        role: user.role,
        subscriptionPlan: user.subscriptionPlan || 'free',
        subscriptionStatus: user.subscriptionStatus,
        messagesUsedThisMonth: user.messagesUsedThisMonth || 0,
        billingCycleStart: user.billingCycleStart,
        billingCycleEnd: user.billingCycleEnd,
        isActive: user.isActive
      }))
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
