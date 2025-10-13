import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const userRepository = AppDataSource.getRepository("users");
    const user = await userRepository.findOne({
      where: { email: session.user.email }
    });

    if (!user || user.role !== 'manager') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get billing data from database
    const subscriptionRepository = AppDataSource.getRepository("subscriptions");
    const invoiceRepository = AppDataSource.getRepository("invoices");

    const subscriptions = await subscriptionRepository.find({
      where: { userId: user.id },
      order: { createdAt: 'DESC' }
    });

    const invoices = await invoiceRepository.find({
      where: { userId: user.id },
      order: { createdAt: 'DESC' }
    });

    // Format data for CSV export
    const csvData = [
      ['Billing Export - ' + new Date().toLocaleDateString()],
      [''],
      ['Account Information'],
      ['Email', user.email],
      ['Name', user.firstName + ' ' + user.lastName],
      ['Role', user.role],
      [''],
      ['Invoice History'],
      ['Invoice ID', 'Date', 'Description', 'Amount', 'Status']
    ];

    invoices.forEach(invoice => {
      csvData.push([
        invoice.id,
        new Date(invoice.createdAt).toLocaleDateString(),
        invoice.description || 'Subscription Payment',
        '$' + (invoice.amount / 100).toFixed(2),
        invoice.status
      ]);
    });

    csvData.push(['']);
    csvData.push(['Subscription History']);
    csvData.push(['Subscription ID', 'Plan', 'Status', 'Start Date', 'End Date']);

    subscriptions.forEach(sub => {
      csvData.push([
        sub.id,
        sub.planName || 'Professional',
        sub.status,
        new Date(sub.startDate).toLocaleDateString(),
        sub.endDate ? new Date(sub.endDate).toLocaleDateString() : 'Active'
      ]);
    });

    // Convert to CSV string
    const csvString = csvData.map(row =>
      row.map(cell => {
        // Escape cells containing commas or quotes
        const cellStr = String(cell || '');
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return '"' + cellStr.replace(/"/g, '""') + '"';
        }
        return cellStr;
      }).join(',')
    ).join('\n');

    // Return CSV file
    return new NextResponse(csvString, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="billing-export-${Date.now()}.csv"`,
      },
    });

  } catch (error) {
    console.error('Error exporting billing data:', error);
    return NextResponse.json(
      { error: 'Failed to export billing data' },
      { status: 500 }
    );
  }
}