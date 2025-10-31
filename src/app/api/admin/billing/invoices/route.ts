import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';

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
    const invoiceRepository = AppDataSource.getRepository('invoices');

    // Get all invoices with manager and subscription details
    const invoices = await invoiceRepository.find({
      relations: ['manager', 'subscription'],
      order: { createdAt: 'DESC' }
    });

    // Transform the data for the frontend
    const formattedInvoices = invoices.map(invoice => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      managerId: invoice.managerId,
      managerName: invoice.manager ? `${invoice.manager.firstName || ''} ${invoice.manager.lastName || ''}`.trim() || invoice.manager.email.split('@')[0] : 'Unknown Manager',
      managerEmail: invoice.manager?.email || 'Unknown',
      subscriptionId: invoice.subscriptionId,
      planName: invoice.subscription?.planName || 'N/A',
      status: invoice.status,
      amount: parseFloat(invoice.amount.toString()),
      tax: parseFloat(invoice.tax?.toString() || '0'),
      discount: parseFloat(invoice.discount?.toString() || '0'),
      total: parseFloat(invoice.total.toString()),
      currency: invoice.currency,
      dueDate: invoice.dueDate.toISOString(),
      paidAt: invoice.paidAt ? invoice.paidAt.toISOString() : null,
      stripeInvoiceId: invoice.stripeInvoiceId,
      stripePaymentIntentId: invoice.stripePaymentIntentId,
      notes: invoice.notes,
      createdAt: invoice.createdAt.toISOString(),
      updatedAt: invoice.updatedAt.toISOString()
    }));

    return NextResponse.json({ invoices: formattedInvoices });

  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
