import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AppDataSource } from '@/config/database';
import { Subscription } from '@/entities/Subscription';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const subscription = await subscriptionRepository.findOne({
      where: { id },
      relations: ['manager']
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ subscription });

  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
      planName,
      status,
      amount,
      currency,
      billingCycle,
      startDate,
      endDate,
      nextBillingDate,
      maxUsers,
      maxBots,
      notes
    } = body;

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    const subscriptionRepository = AppDataSource.getRepository(Subscription);

    const subscription = await subscriptionRepository.findOne({
      where: { id: (await params).id }
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Update subscription fields
    if (planName !== undefined) subscription.planName = planName;
    if (status !== undefined) subscription.status = status;
    if (amount !== undefined) subscription.amount = amount;
    if (currency !== undefined) subscription.currency = currency;
    if (billingCycle !== undefined) subscription.billingCycle = billingCycle;
    if (startDate !== undefined) subscription.startDate = new Date(startDate);
    if (endDate !== undefined) subscription.endDate = new Date(endDate);
    if (nextBillingDate !== undefined) subscription.nextBillingDate = new Date(nextBillingDate);
    if (maxUsers !== undefined) subscription.maxUsers = maxUsers;
    if (maxBots !== undefined) subscription.maxBots = maxBots;
    if (notes !== undefined) subscription.notes = notes;

    const updatedSubscription = await subscriptionRepository.save(subscription);

    return NextResponse.json({
      message: 'Subscription updated successfully',
      subscription: updatedSubscription
    });

  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const subscription = await subscriptionRepository.findOne({
      where: { id: (await params).id }
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    await subscriptionRepository.remove(subscription);

    return NextResponse.json({
      message: 'Subscription deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
