import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/utils/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
      [session.user.id]
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