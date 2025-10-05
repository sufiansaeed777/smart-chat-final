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

    // We'll check the role from the database instead of session

    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // First, get the current user to find their ID and verify role
    const userRepository = AppDataSource.getRepository("users");
    const currentUser = await userRepository.findOne({
      where: { email: session.user.email }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'Current user not found' }, { status: 404 });
    }

    if (currentUser.role !== 'manager') {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 });
    }

    // Fetch all users invited by this manager (both accepted and pending)
    const invitedUsers = await userRepository
      .createQueryBuilder('user')
      .where('user.invitedBy = :managerId', { managerId: currentUser.id })
      .select([
        'user.id',
        'user.firstName',
        'user.lastName',
        'user.email',
        'user.role',
        'user.password',
        'user.lastLoginAt',
        'user.createdAt'
      ])
      .getMany();

    // Transform the data to include status based on whether they have a password
    const usersWithStatus = invitedUsers.map(user => {
      // Properly handle undefined/null values
      const firstName = user.firstName || '';
      const lastName = user.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim();
      return {
        id: user.id,
        name: fullName || user.email.split('@')[0] || 'Unknown User', // Fallback to email username or 'Unknown User'
        email: user.email,
        role: user.role,
        status: user.password ? 'accepted' : 'pending', // accepted if they have password, pending if not
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt
      };
    });

    return NextResponse.json({ users: usersWithStatus });

  } catch (error) {
    console.error('Error fetching manager users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
