import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';

// GET /api/billing - Fetch user's billing information
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const userRepository = AppDataSource.getRepository('users');
    const user = await userRepository.findOne({
      where: { email: session.user.email },
      relations: ['subscription', 'invoices', 'bots']
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch subscription data - check both user.subscription relation and subscriptions table for managers
    let subscriptionData = user.subscription || null;

    // If user is a manager and no subscription relation, check subscriptions table directly
    if (!subscriptionData && user.role === 'manager') {
      const subscriptionRepository = AppDataSource.getRepository('subscriptions');
      subscriptionData = await subscriptionRepository.findOne({
        where: { managerId: user.id },
        order: { createdAt: 'DESC' }
      });
    }

    // Fetch invoices data - Invoice entity uses managerId, not userId
    const invoiceRepository = AppDataSource.getRepository('invoices');
    const invoices = await invoiceRepository.find({
      where: { managerId: user.id },
      relations: ['subscription'],
      order: { createdAt: 'DESC' }
    });

    // Count real usage stats
    const botRepository = AppDataSource.getRepository('bots');
    const conversationRepository = AppDataSource.getRepository('conversations');
    const documentRepository = AppDataSource.getRepository('documents');

    const [botsCount, conversationsCount, documentsCount, userCount] = await Promise.all([
      botRepository.count({ where: { createdBy: user.id, status: 'active' } }),
      conversationRepository.count({ where: { userId: user.id } }),
      documentRepository.count({ where: { userId: user.id, status: 'active' } }),
      userRepository.count({ where: { role: 'agent' } }) // Assuming agents are users under this manager
    ]);

    // Calculate storage (estimate based on documents)
    const documents = await documentRepository.find({
      where: { userId: user.id, status: 'active' }
    });
    const totalStorage = documents.reduce((sum: number, doc: any) => sum + (doc.size || 0), 0) / (1024 * 1024 * 1024); // Convert to GB

    // Determine plan limits based on subscription or user's subscriptionPlan field
    let planData = null;
    // Get plan type from subscription record or user's subscriptionPlan field
    const planType = subscriptionData?.planName?.toLowerCase() || user.subscriptionPlan?.toLowerCase() || 'free';

    if (subscriptionData || user.subscriptionPlan) {

      // Plan limits matching the assign-plan API pricing
      const planLimits: any = {
        free: {
          name: 'Free',
          price: 0,
          period: 'month',
          features: ['Up to 1 User', 'Up to 1 Bot', 'Basic Support', '100 Messages/month'],
          limits: {
            users: 1,
            bots: 1,
            conversations: 100,
            storage: 1
          }
        },
        starter: {
          name: 'Starter',
          price: 29,
          period: 'month',
          features: ['Up to 5 Users', 'Up to 3 Bots', 'Email Support', '1,000 Messages/month'],
          limits: {
            users: 5,
            bots: 3,
            conversations: 1000,
            storage: 5
          }
        },
        professional: {
          name: 'Professional',
          price: 79,
          period: 'month',
          features: ['Up to 20 Users', 'Up to 10 Bots', 'Priority Support', '5,000 Messages/month'],
          limits: {
            users: 20,
            bots: 10,
            conversations: 5000,
            storage: 50
          }
        },
        enterprise: {
          name: 'Enterprise',
          price: 199,
          period: 'month',
          features: ['Up to 100 Users', 'Up to 50 Bots', '24/7 Support', '50,000 Messages/month'],
          limits: {
            users: 100,
            bots: 50,
            conversations: 50000,
            storage: 500
          }
        }
      };

      const plan = planLimits[planType.toLowerCase()] || planLimits.free;

      // Use subscription's actual amount if available, otherwise use plan default
      const actualPrice = subscriptionData?.amount ? parseFloat(subscriptionData.amount) : plan.price;
      const actualPeriod = subscriptionData?.billingCycle || plan.period;

      planData = {
        name: plan.name,
        price: actualPrice,
        period: actualPeriod,
        features: plan.features,
        status: subscriptionData?.status || user.subscriptionStatus || 'active',
        nextBilling: subscriptionData?.nextBillingDate || subscriptionData?.endDate || user.billingCycleEnd || null,
        paymentMethod: user.paymentMethod || null,
        usage: {
          users: userCount,
          usersLimit: subscriptionData?.maxUsers || plan.limits.users,
          bots: botsCount,
          botsLimit: subscriptionData?.maxBots || plan.limits.bots,
          conversations: conversationsCount,
          conversationsLimit: plan.limits.conversations,
          storage: parseFloat(totalStorage.toFixed(2)),
          storageLimit: plan.limits.storage
        }
      };
    }

    // Format invoices
    const formattedInvoices = invoices.map((inv: any) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      date: inv.createdAt,
      dueDate: inv.dueDate,
      amount: parseFloat(inv.total?.toString() || inv.amount?.toString() || '0'),
      status: inv.status,
      description: inv.notes || `${inv.subscription?.planName || planData?.name || 'Subscription'} - ${new Date(inv.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
    }));

    return NextResponse.json({
      hasSubscription: !!(subscriptionData || user.subscriptionPlan),
      subscription: planData,
      invoices: formattedInvoices
    });

  } catch (error) {
    console.error('[Billing API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch billing data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
