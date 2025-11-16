import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { User } from '@/entities/User';

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is manager or admin
    const userRole = (session.user as { role?: string }).role;
    if (userRole !== 'manager' && userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Manager or Admin access required' }, { status: 403 });
    }

    const { userId, firstName, lastName, email, role } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Initialize database
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const userRepository = AppDataSource.getRepository(User);

    // Find the user to update
    const userToUpdate = await userRepository.findOne({ where: { id: userId } });

    if (!userToUpdate) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update user details
    if (firstName) {
      userToUpdate.firstName = firstName.trim();
    }
    if (lastName) {
      userToUpdate.lastName = lastName.trim();
    }
    if (email && email !== userToUpdate.email) {
      // Check if email is already taken
      const existingUser = await userRepository.findOne({ where: { email } });
      if (existingUser && existingUser.id !== userId) {
        return NextResponse.json({ error: 'Email is already in use' }, { status: 400 });
      }
      userToUpdate.email = email.trim().toLowerCase();
    }
    if (role && (role === 'user' || role === 'manager' || role === 'admin')) {
      // Only admins can change roles to admin
      if (role === 'admin' && userRole !== 'admin') {
        return NextResponse.json({ error: 'Only admins can assign admin role' }, { status: 403 });
      }
      userToUpdate.role = role;
    }

    // Save the updated user
    await userRepository.save(userToUpdate);

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: {
        id: userToUpdate.id,
        firstName: userToUpdate.firstName,
        lastName: userToUpdate.lastName,
        email: userToUpdate.email,
        role: userToUpdate.role
      }
    });

  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}
