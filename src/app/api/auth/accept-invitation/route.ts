import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/config/database';
import { User } from '@/entities/User';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
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

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user with password and mark as verified
    await userRepository.update(user.id, {
      password: hashedPassword,
      isEmailVerified: true,
      invitationToken: null,
      tokenExpiry: null,
      updatedAt: new Date()
    });

    return NextResponse.json({ 
      message: 'Account set up successfully',
      userId: user.id 
    });

  } catch (error) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      { error: 'Failed to set up account' },
      { status: 500 }
    );
  }
}
