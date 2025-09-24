import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { User } from '@/entities/User';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Initialize database connection with timeout
    if (!AppDataSource.isInitialized) {
      try {
        await Promise.race([
          AppDataSource.initialize(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Database connection timeout')), 5000)
          )
        ]);
      } catch (error) {
        console.error('Database connection failed:', error);
        return NextResponse.json(
          { error: 'Database connection failed' },
          { status: 503 }
        );
      }
    }

    // Get user from database and validate they're still active
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ 
      where: { email: session.user.email } 
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is still active and has a password (not deactivated)
    if (!user.isActive || !user.password) {
      return NextResponse.json({ 
        error: 'User account has been deactivated' 
      }, { status: 403 });
    }

    // Return user profile data
    return NextResponse.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      lastLoginAt: user.lastLoginAt
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    
    // Handle specific database connection errors
    if (error instanceof Error && error.message.includes('Connection')) {
      return NextResponse.json(
        { error: 'Database connection error' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
