import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { User } from '@/entities/User';

/**
 * GET /api/billing/subscription
 * Fetches real subscription data from User entity (NOT from separate Subscription entity)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch real usage statistics
    const botRepository = AppDataSource.getRepository('bots');
    const conversationRepository = AppDataSource.getRepository('conversations');
    const agentRepository = AppDataSource.getRepository('users');

    // Get bots created by this user
    const userBots = await botRepository.find({
      where: { createdBy: user.id, status: 'active' },
      select: ['id']
    });
    const botIds = userBots.map((b: { id: string }) => b.id);

    // Count conversations for user's bots (same logic as analytics)
    let totalConversations = 0;
    if (botIds.length > 0) {
      totalConversations = await conversationRepository
        .createQueryBuilder('conversation')
        .where('conversation.botId IN (:...botIds)', { botIds })
        .getCount();
    }

    const [totalBots, totalAgents] = await Promise.all([
      botRepository.count({ where: { createdBy: user.id, status: 'active' } }),
      agentRepository.count({ where: { invitedBy: user.id } })
    ]);

    // Define plan limits based on subscription plan
    // Pricing must match PLAN_PRICING in /api/admin/billing/assign-plan
    const planLimits: Record<string, any> = {
      free: {
        name: 'Free',
        price: 0,
        period: 'month',
        features: ['Up to 1 User', 'Up to 1 Bot', 'Basic Support', '100 Conversations/month'],
        limits: { users: 1, bots: 1, conversations: 100, storage: 1 }
      },
      starter: {
        name: 'Starter',
        price: 29,
        period: 'month',
        features: ['Up to 5 Users', 'Up to 3 Bots', 'Email Support', '1,000 Conversations/month'],
        limits: { users: 5, bots: 3, conversations: 1000, storage: 10 }
      },
      professional: {
        name: 'Professional',
        price: 79,
        period: 'month',
        features: ['Up to 20 Users', 'Up to 10 Bots', 'Priority Support', '5,000 Conversations/month'],
        limits: { users: 20, bots: 10, conversations: 5000, storage: 50 }
      },
      enterprise: {
        name: 'Enterprise',
        price: 199,
        period: 'month',
        features: ['Up to 100 Users', 'Up to 50 Bots', '24/7 Support', '50,000 Conversations/month'],
        limits: { users: 100, bots: 50, conversations: 50000, storage: 999999 }
      }
    };

    // Get current plan from User entity (subscriptionPlan field)
    const currentPlanType = user.subscriptionPlan || 'free';
    const planConfig = planLimits[currentPlanType] || planLimits.free;

    // Build response with real data
    const subscriptionData = {
      hasSubscription: user.subscriptionPlan !== 'free',
      plan: {
        name: planConfig.name,
        price: planConfig.price,
        period: planConfig.period,
        features: planConfig.features,
        status: user.subscriptionStatus || 'inactive',
        stripeCustomerId: user.stripeCustomerId || null,
        stripeSubscriptionId: user.stripeSubscriptionId || null,
      },
      usage: {
        users: totalAgents,
        usersLimit: planConfig.limits.users,
        bots: totalBots,
        botsLimit: planConfig.limits.bots,
        conversations: totalConversations,
        conversationsLimit: planConfig.limits.conversations,
        storage: 0, // TODO: Calculate actual storage usage
        storageLimit: planConfig.limits.storage
      }
    };

    return NextResponse.json(subscriptionData);

  } catch (error) {
    console.error('[Billing Subscription API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription data' },
      { status: 500 }
    );
  }
}
