import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No active session' }, { status: 401 });
    }

    // This endpoint can be called to force a session refresh
    // The JWT callback will handle the actual validation
    return NextResponse.json({ 
      success: true, 
      message: 'Session validation triggered' 
    });

  } catch (error) {
    console.error('Error invalidating session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
