import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { User } from '@/entities/User';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const userRepository = AppDataSource.getRepository("users");

    // Get user from database
    const user = await userRepository.findOne({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Deactivate the user account
    // Set isActive to false and optionally nullify password to prevent login
    await userRepository.update(user.id, {
      isActive: false,
      // Optionally set a deactivated timestamp
      // deactivatedAt: new Date()
    });

    console.log('Account deactivated for user:', user.email);

    return NextResponse.json({
      success: true,
      message: 'Account deactivated successfully'
    });

  } catch (error) {
    console.error('Error deactivating account:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
