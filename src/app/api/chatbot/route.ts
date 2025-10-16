import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message, apiKey, timestamp } = await request.json();

    if (!message || !apiKey) {
      return NextResponse.json(
        { error: 'Message and API key are required' },
        { status: 400 }
      );
    }

    // Send to OpenAI API using the provided key
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI assistant for a chatbot SaaS platform. Provide friendly, helpful responses to user queries. Keep responses concise and professional.'
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!openaiResponse.ok) {
      throw new Error('OpenAI API request failed');
    }

    const openaiData = await openaiResponse.json();
    const response = openaiData.choices[0]?.message?.content || 'I apologize, but I could not process your request.';

    // Store the conversation data for admin dashboard
    const conversationData = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      message,
      response,
      timestamp,
      userAgent: request.headers.get('user-agent') || '',
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      sessionId: request.headers.get('x-session-id') || 'unknown'
    };

    // Here you would typically save to database
    // For now, we'll log it (in production, save to your database)
    console.log('Chat conversation:', conversationData);

    return NextResponse.json({
      response,
      conversationId: conversationData.id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chatbot API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
