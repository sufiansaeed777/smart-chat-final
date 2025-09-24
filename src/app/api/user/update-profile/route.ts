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

    const { firstName, lastName, email } = await request.json();

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return NextResponse.json({ 
        error: 'First name, last name, and email are required' 
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        error: 'Please enter a valid email address' 
      }, { status: 400 });
    }

    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Get current user first
    const userRepository = AppDataSource.getRepository(User);
    const currentUser = await userRepository.findOne({
      where: { email: session.user.email }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if email is already taken by another user
    const existingUser = await userRepository.findOne({
      where: {
        email: email
      }
    });

    // If user exists and it's not the current user
    if (existingUser && existingUser.id !== currentUser.id) {
      return NextResponse.json({ 
        error: 'Email address is already in use' 
      }, { status: 400 });
    }

    // Update user profile
    await userRepository.update(currentUser.id, {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim()
    });

    // Get updated user
    const updatedUser = await userRepository.findOne({
      where: { id: currentUser.id }
    });

    if (!updatedUser) {
      return NextResponse.json({ error: 'Failed to retrieve updated user' }, { status: 500 });
    }

    console.log('Profile updated successfully for user:', updatedUser.email);

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    // TypeORM doesn't need explicit disconnect in this context
  }
}
