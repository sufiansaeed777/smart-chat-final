import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { AppDataSource } from '@/config/database';
import { User } from '@/entities/User';

export async function POST(request: NextRequest) {
  try {
    // Initialize database connection only if not already initialized
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim();

    // Find user by email - use string to avoid minification issues
    const userRepository = AppDataSource.getRepository("users");
    const user = await userRepository.findOne({ where: { email: normalizedEmail } });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Debug: Log user status
    console.log('Login attempt for user:', {
      email: user.email,
      isActive: user.isActive,
      hasPassword: !!user.password,
      isEmailVerified: user.isEmailVerified
    });

    // Check if user is active
    if (!user.isActive) {
      console.log('Login blocked: User is not active');
      return NextResponse.json(
        { error: 'Your account has been deactivated. Please contact your administrator.' },
        { status: 401 }
      );
    }

    // Check if user has a password (not deactivated)
    if (!user.password) {
      console.log('Login blocked: User has no password');
      return NextResponse.json(
        { error: 'Your account has been deactivated. Please contact your administrator.' },
        { status: 401 }
      );
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return NextResponse.json(
        { 
          error: 'Please verify your email before logging in. Check your inbox for a verification link.',
          needsVerification: true,
          email: user.email
        },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = user.password ? await bcrypt.compare(password, user.password) : false;
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Update last login
    user.lastLoginAt = new Date();
    await userRepository.save(user);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Determine redirect URL based on user role
    let redirectUrl = '/user-dashboard'; // default
    if (user.role === 'admin') {
      redirectUrl = '/admin-dashboard';
    } else if (user.role === 'manager') {
      redirectUrl = '/manager-dashboard';
    }

    return NextResponse.json({
      message: 'Login successful',
      user: userWithoutPassword,
      redirectUrl: redirectUrl
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
