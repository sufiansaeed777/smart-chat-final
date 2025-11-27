import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const userRepository = AppDataSource.getRepository('users');
    const currentUser = await userRepository.findOne({
      where: { email: session.user.email }
    });

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get('role');
    const search = searchParams.get('search');

    let query = userRepository.createQueryBuilder('user');

    if (role && role !== 'all') {
      query = query.andWhere('user.role = :role', { role });
    }

    if (search) {
      query = query.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    query = query.orderBy('user.createdAt', 'DESC');
    const users = await query.getMany();

    const sanitizedUsers = users.map(user => {
      // Determine status: active (isActive=true), pending (not active + not verified), inactive (not active + verified)
      let status = 'inactive';
      if (user.isActive) {
        status = 'active';
      } else if (!user.isEmailVerified) {
        status = 'pending';
      }

      return {
        id: user.id,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email,
        role: user.role,
        status,
        isEmailVerified: user.isEmailVerified || false,
        lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt).toISOString() : 'Never',
        subscriptionPlan: user.subscriptionPlan || 'free',
        subscriptionStatus: user.subscriptionStatus,
        messagesUsedThisMonth: user.messagesUsedThisMonth || 0,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
    });

    return NextResponse.json({
      success: true,
      users: sanitizedUsers,
      total: users.length
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const userRepository = AppDataSource.getRepository('users');
    const currentUser = await userRepository.findOne({
      where: { email: session.user.email }
    });

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { userId, updates } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const userToUpdate = await userRepository.findOne({
      where: { id: userId }
    });

    if (!userToUpdate) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (userToUpdate.id === currentUser.id && updates.role && updates.role !== currentUser.role) {
      return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 });
    }

    // Map status to isActive and isEmailVerified
    const dbUpdates: any = { ...updates };
    if (updates.status) {
      if (updates.status === 'active') {
        dbUpdates.isActive = true;
      } else if (updates.status === 'pending') {
        // Pending = not active + not verified
        dbUpdates.isActive = false;
        dbUpdates.isEmailVerified = false;
      } else {
        // Inactive = not active (keep email verification status)
        dbUpdates.isActive = false;
      }
      delete dbUpdates.status;
    }

    // Hash password if provided
    if (updates.password) {
      // Remove plain text password from updates object
      delete dbUpdates.password;
      // Hash and set the new password
      const hashedPassword = await bcrypt.hash(updates.password, 10);
      dbUpdates.password = hashedPassword;
    }

    await userRepository.update(userId, dbUpdates);

    const updatedUser = await userRepository.findOne({
      where: { id: userId }
    });

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: {
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        role: updatedUser.role
      }
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const userRepository = AppDataSource.getRepository('users');
    const currentUser = await userRepository.findOne({
      where: { email: session.user.email }
    });

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (userId === currentUser.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    const userToDelete = await userRepository.findOne({
      where: { id: userId }
    });

    if (!userToDelete) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await userRepository.delete(userId);

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
