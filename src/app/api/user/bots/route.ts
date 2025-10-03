import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/utils/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user ID from email first
    const userResult = await pool.query(
      `SELECT id FROM users WHERE email = $1`,
      [session.user.email]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = userResult.rows[0].id;

    // Fetch all bots created by the user
    const result = await pool.query(
      `SELECT
        id,
        name,
        description,
        domain,
        status,
        "welcomeMessage",
        "systemPrompt",
        model,
        temperature,
        "maxTokens",
        "createdAt",
        "updatedAt"
      FROM bots
      WHERE "createdBy" = $1
      ORDER BY "createdAt" DESC`,
      [userId]
    );

    return NextResponse.json({
      bots: result.rows,
      count: result.rowCount
    });

  } catch (error) {
    console.error('Error fetching user bots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bots' },
      { status: 500 }
    );
  }
}