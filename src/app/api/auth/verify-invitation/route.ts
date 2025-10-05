import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/config/database';
import { User } from '@/entities/User';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const userRepository = AppDataSource.getRepository("users");
    const user = await userRepository.findOne({
      where: { invitationToken: token }
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid invitation token' }, { status: 400 });
    }

    // Check if token is expired
    if (user.tokenExpiry && new Date() > user.tokenExpiry) {
      return NextResponse.json({ error: 'Invitation link has expired' }, { status: 400 });
    }

    // Check if user is already verified
    if (user.isEmailVerified) {
      return NextResponse.json({ error: 'Account is already set up' }, { status: 400 });
    }

    return NextResponse.json({
      user: {
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Error verifying invitation:', error);
    return NextResponse.json(
      { error: 'Failed to verify invitation' },
      { status: 500 }
    );
  }
}
