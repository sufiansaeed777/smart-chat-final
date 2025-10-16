import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { issueType, description, email, apiKey, timestamp } = await request.json();

    if (!issueType || !description || !apiKey) {
      return NextResponse.json(
        { error: 'Issue type, description, and API key are required' },
        { status: 400 }
      );
    }

    // Store the issue report data
    const issueReportData = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      type: 'issue_report',
      issueType,
      description,
      email: email || 'not_provided',
      timestamp,
      userAgent: request.headers.get('user-agent') || '',
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      sessionId: request.headers.get('x-session-id') || 'unknown',
      status: 'open',
      priority: issueType === 'Bug Report' ? 'high' : 'medium'
    };

    // Here you would typically:
    // 1. Save to database
    // 2. Send notification to n8n webhook
    // 3. Create support ticket
    // 4. Notify development team

    console.log('Issue report:', issueReportData);

    // Example n8n webhook call (replace with your actual n8n webhook URL)
    try {
      await fetch('https://your-n8n-instance.com/webhook/issue-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...issueReportData,
          webhook_source: 'chatbot'
        }),
      });
    } catch (webhookError) {
      console.error('Failed to send to n8n webhook:', webhookError);
      // Continue execution even if webhook fails
    }

    return NextResponse.json({
      success: true,
      reportId: issueReportData.id,
      message: 'Issue reported successfully'
    });

  } catch (error) {
    console.error('Issue report API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
