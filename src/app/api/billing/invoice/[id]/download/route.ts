import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// Invoice data structure matching the View Invoice page
function getInvoiceData(invoiceId: string) {
  return {
    id: invoiceId,
    number: invoiceId,
    date: '2024-01-01',
    dueDate: '2024-01-15',
    amount: 99,
    tax: 9.90,
    subtotal: 89.10,
    status: 'paid',
    description: 'Professional Plan - January 2024',
    billingPeriod: 'January 1, 2024 - January 31, 2024',
    paymentMethod: '**** 4242',
    transactionId: 'txn_' + invoiceId,
    company: {
      name: 'Smart Chat Inc.',
      address: '123 AI Street',
      city: 'San Francisco',
      state: 'CA',
      zip: '94102',
      country: 'United States',
      email: 'billing@smartchat.com',
      phone: '+1 (555) 123-4567'
    },
    customer: {
      name: 'Your Company',
      email: 'customer@example.com',
      address: '456 Business Ave',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      country: 'United States'
    },
    items: [
      {
        description: 'Professional Plan Subscription',
        quantity: 1,
        rate: 89.10,
        amount: 89.10
      }
    ]
  };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const invoice = getInvoiceData(id);

    // Generate PDF with the same layout as the View Invoice page
    const pdfContent = generateInvoicePDF(invoice);

    return new NextResponse(pdfContent, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${id}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error downloading invoice:', error);
    return NextResponse.json(
      { error: 'Failed to download invoice' },
      { status: 500 }
    );
  }
}

// Generate PDF matching the View Invoice page layout
function generateInvoicePDF(invoice: ReturnType<typeof getInvoiceData>): Buffer {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // PDF content streams - building a proper PDF structure
  const contentLines = [
    // Header - INVOICE title
    'BT',
    '/F1 28 Tf',
    '50 750 Td',
    '(INVOICE) Tj',
    'ET',

    // Invoice Number
    'BT',
    '/F1 11 Tf',
    '50 725 Td',
    `(${invoice.number}) Tj`,
    'ET',

    // Status badge
    'BT',
    '/F1 10 Tf',
    '450 750 Td',
    `(Status: ${invoice.status.toUpperCase()}) Tj`,
    'ET',

    // Dates
    'BT',
    '/F1 10 Tf',
    '50 700 Td',
    `(Date: ${formatDate(invoice.date)}) Tj`,
    'ET',
    'BT',
    '/F1 10 Tf',
    '50 685 Td',
    `(Due Date: ${formatDate(invoice.dueDate)}) Tj`,
    'ET',

    // Transaction ID
    'BT',
    '/F1 9 Tf',
    '400 725 Td',
    '(Transaction ID:) Tj',
    'ET',
    'BT',
    '/F1 9 Tf',
    '400 712 Td',
    `(${invoice.transactionId}) Tj`,
    'ET',

    // Horizontal line
    'q',
    '0.8 0.8 0.8 RG',
    '50 665 m',
    '550 665 l',
    '1 w',
    'S',
    'Q',

    // FROM section
    'BT',
    '/F1 9 Tf',
    '0.5 0.5 0.5 rg',
    '50 645 Td',
    '(FROM) Tj',
    'ET',
    'BT',
    '/F1 11 Tf',
    '0 0 0 rg',
    '50 628 Td',
    `(${invoice.company.name}) Tj`,
    'ET',
    'BT',
    '/F1 10 Tf',
    '50 613 Td',
    `(${invoice.company.address}) Tj`,
    'ET',
    'BT',
    '/F1 10 Tf',
    '50 598 Td',
    `(${invoice.company.city}, ${invoice.company.state} ${invoice.company.zip}) Tj`,
    'ET',
    'BT',
    '/F1 10 Tf',
    '50 583 Td',
    `(${invoice.company.country}) Tj`,
    'ET',
    'BT',
    '/F1 10 Tf',
    '50 563 Td',
    `(${invoice.company.email}) Tj`,
    'ET',
    'BT',
    '/F1 10 Tf',
    '50 548 Td',
    `(${invoice.company.phone}) Tj`,
    'ET',

    // BILL TO section
    'BT',
    '/F1 9 Tf',
    '0.5 0.5 0.5 rg',
    '320 645 Td',
    '(BILL TO) Tj',
    'ET',
    'BT',
    '/F1 11 Tf',
    '0 0 0 rg',
    '320 628 Td',
    `(${invoice.customer.name}) Tj`,
    'ET',
    'BT',
    '/F1 10 Tf',
    '320 613 Td',
    `(${invoice.customer.address}) Tj`,
    'ET',
    'BT',
    '/F1 10 Tf',
    '320 598 Td',
    `(${invoice.customer.city}, ${invoice.customer.state} ${invoice.customer.zip}) Tj`,
    'ET',
    'BT',
    '/F1 10 Tf',
    '320 583 Td',
    `(${invoice.customer.country}) Tj`,
    'ET',
    'BT',
    '/F1 10 Tf',
    '320 563 Td',
    `(${invoice.customer.email}) Tj`,
    'ET',

    // Invoice Details section header
    'BT',
    '/F1 9 Tf',
    '0.5 0.5 0.5 rg',
    '50 510 Td',
    '(INVOICE DETAILS) Tj',
    'ET',

    // Table header background
    'q',
    '0.95 0.95 0.95 rg',
    '50 480 500 20 re',
    'f',
    'Q',

    // Table headers
    'BT',
    '/F1 9 Tf',
    '0.4 0.4 0.4 rg',
    '55 487 Td',
    '(DESCRIPTION) Tj',
    'ET',
    'BT',
    '/F1 9 Tf',
    '320 487 Td',
    '(QTY) Tj',
    'ET',
    'BT',
    '/F1 9 Tf',
    '400 487 Td',
    '(RATE) Tj',
    'ET',
    'BT',
    '/F1 9 Tf',
    '490 487 Td',
    '(AMOUNT) Tj',
    'ET',

    // Table row
    'BT',
    '/F1 10 Tf',
    '0 0 0 rg',
    '55 460 Td',
    `(${invoice.items[0].description}) Tj`,
    'ET',
    'BT',
    '/F1 10 Tf',
    '330 460 Td',
    `(${invoice.items[0].quantity}) Tj`,
    'ET',
    'BT',
    '/F1 10 Tf',
    '395 460 Td',
    `($${invoice.items[0].rate.toFixed(2)}) Tj`,
    'ET',
    'BT',
    '/F1 10 Tf',
    '485 460 Td',
    `($${invoice.items[0].amount.toFixed(2)}) Tj`,
    'ET',

    // Table border
    'q',
    '0.8 0.8 0.8 RG',
    '50 480 500 -40 re',
    '1 w',
    'S',
    'Q',

    // Totals section
    'BT',
    '/F1 10 Tf',
    '0.5 0.5 0.5 rg',
    '380 400 Td',
    '(Subtotal:) Tj',
    'ET',
    'BT',
    '/F1 10 Tf',
    '0 0 0 rg',
    '485 400 Td',
    `($${invoice.subtotal.toFixed(2)}) Tj`,
    'ET',

    'BT',
    '/F1 10 Tf',
    '0.5 0.5 0.5 rg',
    '380 382 Td',
    '(Tax \\(10%\\):) Tj',
    'ET',
    'BT',
    '/F1 10 Tf',
    '0 0 0 rg',
    '485 382 Td',
    `($${invoice.tax.toFixed(2)}) Tj`,
    'ET',

    // Total line
    'q',
    '0.8 0.8 0.8 RG',
    '380 370 170 0 m',
    '380 370 l',
    '550 370 l',
    '1 w',
    'S',
    'Q',

    'BT',
    '/F1 12 Tf',
    '0 0 0 rg',
    '380 350 Td',
    '(Total:) Tj',
    'ET',
    'BT',
    '/F1 12 Tf',
    '0.4 0.4 0.94 rg',
    '480 350 Td',
    `($${invoice.amount.toFixed(2)}) Tj`,
    'ET',

    // Payment Information section
    'q',
    '0.96 0.96 0.96 rg',
    '50 280 500 50 re',
    'f',
    'Q',

    'BT',
    '/F1 9 Tf',
    '0.4 0.4 0.4 rg',
    '60 310 Td',
    '(PAYMENT INFORMATION) Tj',
    'ET',

    'BT',
    '/F1 10 Tf',
    '0.5 0.5 0.5 rg',
    '60 292 Td',
    '(Billing Period:) Tj',
    'ET',
    'BT',
    '/F1 10 Tf',
    '0 0 0 rg',
    '150 292 Td',
    `(${invoice.billingPeriod}) Tj`,
    'ET',

    'BT',
    '/F1 10 Tf',
    '0.5 0.5 0.5 rg',
    '350 292 Td',
    '(Payment Method:) Tj',
    'ET',
    'BT',
    '/F1 10 Tf',
    '0 0 0 rg',
    '450 292 Td',
    `(${invoice.paymentMethod}) Tj`,
    'ET',

    // Footer
    'q',
    '0.8 0.8 0.8 RG',
    '50 230 m',
    '550 230 l',
    '1 w',
    'S',
    'Q',

    'BT',
    '/F1 10 Tf',
    '0.5 0.5 0.5 rg',
    '200 210 Td',
    '(Thank you for your business!) Tj',
    'ET',
    'BT',
    '/F1 9 Tf',
    '130 192 Td',
    `(If you have any questions about this invoice, please contact ${invoice.company.email}) Tj`,
    'ET',
  ];

  const contentStream = contentLines.join('\n');
  const contentLength = contentStream.length;

  const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Resources <<
/Font <<
/F1 4 0 R
>>
>>
/MediaBox [0 0 612 792]
/Contents 5 0 R
>>
endobj
4 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj
5 0 obj
<<
/Length ${contentLength}
>>
stream
${contentStream}
endstream
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000270 00000 n
0000000349 00000 n
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
${400 + contentLength}
%%EOF
`;

  return Buffer.from(pdfContent, 'utf-8');
}
