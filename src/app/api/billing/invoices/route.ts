import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { User } from '@/entities/User';
import { Invoice } from '@/entities/Invoice';

/**
 * GET /api/billing/invoices
 * Fetches invoices for the current logged-in user
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
    const invoiceRepository = AppDataSource.getRepository(Invoice);

    // Find the current user
    const user = await userRepository.findOne({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch invoices for this user (managerId field)
    const invoices = await invoiceRepository.find({
      where: { managerId: user.id },
      relations: ['subscription'],
      order: { createdAt: 'DESC' }
    });

    // Transform the data for the frontend
    const formattedInvoices = invoices.map((invoice: any) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      date: invoice.createdAt ? new Date(invoice.createdAt).toISOString() : new Date().toISOString(),
      // Use planName directly from invoice, fallback to subscription or notes
      planName: invoice.planName || invoice.subscription?.planName || invoice.notes?.split(' - ')[0] || 'Subscription',
      amount: parseFloat(invoice.total?.toString() || invoice.amount?.toString() || '0'),
      status: invoice.status || 'open',
      dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString() : null,
      paidAt: invoice.paidAt ? new Date(invoice.paidAt).toISOString() : null,
      currency: invoice.currency || 'USD',
      notes: invoice.notes
    }));

    return NextResponse.json({
      success: true,
      invoices: formattedInvoices
    });

  } catch (error) {
    console.error('[Billing Invoices API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}
