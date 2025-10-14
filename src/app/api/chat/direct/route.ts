import { NextRequest, NextResponse } from 'next/server';
import { searchSimilarChunks } from '@/services/openaiTrainingService';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Direct RAG Chat Endpoint (bypasses n8n)
 * This endpoint handles chat directly using our own retrieval logic
 */
export async function POST(request: NextRequest) {
  try {
    const { botId, message, chatId } = await request.json();

    if (!botId || !message) {
      return NextResponse.json(
        { error: 'botId and message are required' },
        { status: 400 }
      );
    }

    console.log(`\n💬 Direct RAG Chat for bot ${botId}`);
    console.log(`📝 User message: ${message}`);

    // Step 1: Search for relevant document chunks using vector similarity
    console.log('🔍 Searching for relevant context...');
    const relevantChunks = await searchSimilarChunks(botId, message, 5);

    if (relevantChunks.length === 0) {
      console.log('⚠️ No relevant context found');
      return NextResponse.json({
        success: true,
        response: "I don't have any relevant information in my training documents to answer that question.",
        chatId,
        contextFound: false,
      });
    }

    console.log(`✅ Found ${relevantChunks.length} relevant chunks`);
    relevantChunks.forEach((chunk, i) => {
      console.log(`   ${i + 1}. Similarity: ${chunk.similarity.toFixed(3)}`);
    });

    // Step 2: Build context from retrieved chunks
    const context = relevantChunks
      .map((chunk, i) => `[Document ${i + 1}]:\n${chunk.content}`)
      .join('\n\n');

    console.log('📚 Context length:', context.length, 'characters');

    // Step 3: Generate response using GPT with context
    console.log('🤖 Generating AI response...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a helpful AI assistant. Answer the user's question based on the following document excerpts.
If the information is not in the documents, say so clearly.

DOCUMENT EXCERPTS:
${context}`,
        },
        {
          role: 'user',
          content: message,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const response = completion.choices[0].message.content || 'No response generated';

    console.log('✅ Response generated:', response.substring(0, 100) + '...');

    return NextResponse.json({
      success: true,
      response,
      chatId: chatId || 'chat-' + Date.now(),
      contextFound: true,
      contextChunks: relevantChunks.length,
      metadata: {
        model: completion.model,
        tokensUsed: completion.usage?.total_tokens,
        topSimilarity: relevantChunks[0]?.similarity.toFixed(3),
      },
    });

  } catch (error: any) {
    console.error('❌ Direct chat error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Chat failed',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
