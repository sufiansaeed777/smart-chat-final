import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { apiKey, timestamp, description } = await request.json();

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    // Store the agent request data
    const agentRequestData = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      type: 'human_agent_request',
      description: description || 'User requested human agent assistance',
      timestamp,
      userAgent: request.headers.get('user-agent') || '',
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      sessionId: request.headers.get('x-session-id') || 'unknown',
      status: 'pending'
    };

    // Here you would typically:
    // 1. Save to database
    // 2. Send notification to n8n webhook
    // 3. Notify human agents
    // 4. Create support ticket

    console.log('Agent request:', agentRequestData);

    // Example n8n webhook call (replace with your actual n8n webhook URL)
    try {
      await fetch('https://your-n8n-instance.com/webhook/agent-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...agentRequestData,
          webhook_source: 'chatbot'
        }),
      });
    } catch (webhookError) {
      console.error('Failed to send to n8n webhook:', webhookError);
      // Continue execution even if webhook fails
    }

    return NextResponse.json({
      success: true,
      requestId: agentRequestData.id,
      estimatedWaitTime: '2-5 minutes',
      message: 'Agent request sent successfully'
    });

  } catch (error) {
    console.error('Agent request API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
