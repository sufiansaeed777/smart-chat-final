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

    // Fetch subscription data
    const subscriptionData = user.subscription || null;

    // Fetch invoices data
    const invoiceRepository = AppDataSource.getRepository('invoices');
    const invoices = await invoiceRepository.find({
      where: { userId: user.id },
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

    // Determine plan limits based on subscription
    let planData = null;
    if (subscriptionData) {
      const planType = subscriptionData.plan || subscriptionData.planType || 'free';

      const planLimits: any = {
        free: {
          name: 'Free',
          price: 0,
          period: 'month',
          features: ['Up to 5 Users', 'Up to 2 Bots', 'Basic Support', 'Basic Analytics'],
          limits: {
            users: 5,
            bots: 2,
            conversations: 100,
            storage: 1
          }
        },
        professional: {
          name: 'Professional',
          price: 99,
          period: 'month',
          features: ['Up to 50 Users', 'Up to 10 Bots', 'Priority Support', 'Advanced Analytics'],
          limits: {
            users: 50,
            bots: 10,
            conversations: 5000,
            storage: 50
          }
        },
        enterprise: {
          name: 'Enterprise',
          price: 299,
          period: 'month',
          features: ['Unlimited Users', 'Unlimited Bots', '24/7 Support', 'Custom Analytics'],
          limits: {
            users: 999999,
            bots: 999999,
            conversations: 999999,
            storage: 999999
          }
        }
      };

      const plan = planLimits[planType.toLowerCase()] || planLimits.free;

      planData = {
        name: plan.name,
        price: plan.price,
        period: plan.period,
        features: plan.features,
        status: subscriptionData.status || 'active',
        nextBilling: subscriptionData.currentPeriodEnd || null,
        paymentMethod: user.paymentMethod || null,
        usage: {
          users: userCount,
          usersLimit: plan.limits.users,
          bots: botsCount,
          botsLimit: plan.limits.bots,
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
      date: inv.createdAt,
      amount: inv.amount,
      status: inv.status,
      description: inv.description || `${planData?.name || 'Subscription'} - ${new Date(inv.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
    }));

    return NextResponse.json({
      hasSubscription: !!subscriptionData,
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
