import { NextRequest, NextResponse } from 'next/server';
import pool from '@/utils/db';
import { AppDataSource } from '@/data-source';
import { ChatbotIssue } from '@/entities/ChatbotIssue';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, bot_id, issue_type, description, conversation_id, source } = body;

    // Validate required fields
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication token is required' },
        { status: 401, headers: corsHeaders }
      );
    }

    if (!description) {
      return NextResponse.json(
        { success: false, error: 'Description is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate token and get bot info
    let tokenData;
    try {
      const tokenCheck = await pool.query(
        `SELECT wt.*, b.name as bot_name, b.id as bot_id, u.email as user_email, u.name as user_name
         FROM wordpress_tokens wt
         JOIN bots b ON wt.bot_id = b.id
         JOIN users u ON wt.user_id = u.id
         WHERE wt.token = $1 AND wt.is_active = true`,
        [token]
      );

      if (tokenCheck.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Invalid or expired token' },
          { status: 401, headers: corsHeaders }
        );
      }

      tokenData = tokenCheck.rows[0];

      // Check if token is expired
      if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
        return NextResponse.json(
          { success: false, error: 'Token has expired', expired: true },
          { status: 401, headers: corsHeaders }
        );
      }
    } catch (dbError) {
      console.error('Token validation error:', dbError);
      return NextResponse.json(
        { success: false, error: 'Token validation failed' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Initialize TypeORM if needed
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Get user info from conversation if available
    let userEmail = 'anonymous@visitor.com';
    let userName = 'Website Visitor';
    let userId = `visitor-${Date.now()}`;
    let websiteUrl = source === 'wordpress' ? tokenData.domain || '' : '';

    // Try to get user info from the conversation
    if (conversation_id) {
      try {
        const conversationResult = await pool.query(
          `SELECT user_email, user_name, metadata FROM conversations WHERE id = $1`,
          [conversation_id]
        );
        if (conversationResult.rows.length > 0) {
          const conv = conversationResult.rows[0];
          userEmail = conv.user_email || userEmail;
          userName = conv.user_name || userName;
          userId = conversation_id;
          if (conv.metadata?.pageUrl) {
            websiteUrl = conv.metadata.pageUrl;
          }
        }
      } catch (err) {
        console.log('Could not fetch conversation info:', err);
      }
    }

    // Map issue_type to entity type
    let issueTypeEnum: 'human_request' | 'issue_report' | 'end_chat' = 'issue_report';
    if (issue_type === 'human_request' || issue_type === 'request_human') {
      issueTypeEnum = 'human_request';
    } else if (issue_type === 'end_chat') {
      issueTypeEnum = 'end_chat';
    }

    // Determine priority based on issue type
    let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
    if (issue_type === 'bug' || issue_type === 'Bug Report') {
      priority = 'high';
    } else if (issue_type === 'human_request' || issue_type === 'request_human') {
      priority = 'high';
    }

    // Create the issue in database
    const issueRepository = AppDataSource.getRepository(ChatbotIssue);
    const newIssue = issueRepository.create({
      type: issueTypeEnum,
      userId: userId,
      userEmail: userEmail,
      userName: userName,
      message: description,
      status: 'pending',
      priority: priority,
      botId: tokenData.bot_id,
      websiteUrl: websiteUrl,
    });

    const savedIssue = await issueRepository.save(newIssue);

    console.log(`[Report Issue] Issue saved: ${savedIssue.id} for bot ${tokenData.bot_name}`);

    return NextResponse.json({
      success: true,
      ticket_id: savedIssue.id,
      message: 'Issue reported successfully',
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Report issue API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
