import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { User } from '@/entities/User';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ 
        error: 'Current password and new password are required' 
      }, { status: 400 });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json({
        error: 'Password must be at least 8 characters long'
      }, { status: 400 });
    }

    // Check for uppercase letter
    if (!/[A-Z]/.test(newPassword)) {
      return NextResponse.json({
        error: 'Password must contain at least one uppercase letter'
      }, { status: 400 });
    }

    // Check for lowercase letter
    if (!/[a-z]/.test(newPassword)) {
      return NextResponse.json({
        error: 'Password must contain at least one lowercase letter'
      }, { status: 400 });
    }

    // Check for number
    if (!/[0-9]/.test(newPassword)) {
      return NextResponse.json({
        error: 'Password must contain at least one number'
      }, { status: 400 });
    }

    // Check for special character
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      return NextResponse.json({
        error: 'Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)'
      }, { status: 400 });
    }

    // Check if new password is different from current password
    if (currentPassword === newPassword) {
      return NextResponse.json({ 
        error: 'New password must be different from current password' 
      }, { status: 400 });
    }

    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Get user with password hash
    const userRepository = AppDataSource.getRepository("users");
    const user = await userRepository.findOne({
      where: {
        email: session.user.email
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify current password
    if (!user.password) {
      return NextResponse.json({ 
        error: 'No password set for this account' 
      }, { status: 400 });
    }
    
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return NextResponse.json({ 
        error: 'Current password is incorrect' 
      }, { status: 400 });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await userRepository.update(user.id, {
      password: hashedNewPassword
    });

    console.log('Password changed successfully for user:', user.email);

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    // TypeORM doesn't need explicit disconnect in this context
  }
}
