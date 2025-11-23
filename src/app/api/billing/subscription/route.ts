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

    const [totalBots, totalConversations, totalAgents] = await Promise.all([
      botRepository.count({ where: { createdBy: user.id, status: 'active' } }),
      conversationRepository.count({ where: { userId: user.id } }),
      agentRepository.count({ where: { invitedBy: user.id } })
    ]);

    // Define plan limits based on subscription plan
    const planLimits: Record<string, any> = {
      free: {
        name: 'Free',
        price: 0,
        period: 'month',
        features: ['Up to 5 Users', 'Up to 2 Bots', 'Basic Support', '100 Conversations/month'],
        limits: { users: 5, bots: 2, conversations: 100, storage: 1 }
      },
      starter: {
        name: 'Starter',
        price: 29,
        period: 'month',
        features: ['Up to 20 Users', 'Up to 5 Bots', 'Email Support', '1,000 Conversations/month'],
        limits: { users: 20, bots: 5, conversations: 1000, storage: 10 }
      },
      professional: {
        name: 'Professional',
        price: 99,
        period: 'month',
        features: ['Up to 50 Users', 'Up to 10 Bots', 'Priority Support', 'Advanced Analytics'],
        limits: { users: 50, bots: 10, conversations: 5000, storage: 50 }
      },
      enterprise: {
        name: 'Enterprise',
        price: 299,
        period: 'month',
        features: ['Unlimited Users', 'Unlimited Bots', '24/7 Support', 'Custom Integrations'],
        limits: { users: 999999, bots: 999999, conversations: 999999, storage: 999999 }
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
