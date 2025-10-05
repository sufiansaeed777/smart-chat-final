import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { User } from '@/entities/User';
import { UserRole } from '@/types/UserRole';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Check if user is admin
    const userRepository = AppDataSource.getRepository("users");
    const currentUser = await userRepository.findOne({
      where: { email: session.user.email },
      select: ['role']
    });

    if (!currentUser || currentUser.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch only manager users
    const users = await userRepository.find({
      where: {
        role: UserRole.MANAGER
      },
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'createdAt', 'updatedAt', 'isEmailVerified', 'isActive', 'lastLoginAt'],
      order: {
        createdAt: 'DESC'
      }
    });

    // Transform the data to match the expected format
    const transformedUsers = users.map(user => {
      const firstName = user.firstName || '';
      const lastName = user.lastName || '';
      
      // Determine status based on isActive
      let status: 'active' | 'inactive' | 'pending' = 'active';
      if (!user.isActive) {
        status = 'inactive';
      } else if (!user.isEmailVerified) {
        status = 'pending';
      }
      
      return {
        id: user.id,
        email: user.email,
        firstName,
        lastName,
        role: user.role as 'admin' | 'manager' | 'user',
        status,
        createdAt: user.createdAt.toISOString().split('T')[0],
        lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString().split('T')[0] : 'Never',
        isEmailVerified: user.isEmailVerified,
        phone: undefined, // Add phone field to User model if needed
        avatar: undefined
      };
    });

    return NextResponse.json({ users: transformedUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
