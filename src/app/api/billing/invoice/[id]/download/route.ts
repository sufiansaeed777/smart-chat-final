import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
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

    // In a real implementation, you would:
    // 1. Fetch the invoice from Stripe using the invoice ID
    // 2. Generate a PDF using a library like PDFKit or jsPDF
    // 3. Return the PDF as a blob

    // For now, we'll create a simple text-based invoice
    const invoiceContent = generateInvoicePDF(id);

    return new NextResponse(invoiceContent, {
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

// Simple PDF generation (in production, use a proper PDF library)
function generateInvoicePDF(invoiceId: string): Buffer {
  // This is a placeholder. In production, use a library like:
  // - PDFKit: https://pdfkit.org/
  // - jsPDF: https://github.com/parallax/jsPDF
  // - Puppeteer: for HTML to PDF conversion

  const pdfContent = `
%PDF-1.4
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
/Length 500
>>
stream
BT
/F1 24 Tf
50 750 Td
(INVOICE) Tj
0 -30 Td
/F1 12 Tf
(Invoice #: ${invoiceId}) Tj
0 -20 Td
(Date: ${new Date().toLocaleDateString()}) Tj
0 -40 Td
(Professional Plan Subscription) Tj
0 -20 Td
(Amount: $99.00) Tj
0 -40 Td
(Status: PAID) Tj
0 -60 Td
(Thank you for your business!) Tj
0 -20 Td
(For questions, contact: billing@smartchat.com) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000274 00000 n
0000000361 00000 n
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
911
%%EOF
`;

  return Buffer.from(pdfContent, 'utf-8');
}
