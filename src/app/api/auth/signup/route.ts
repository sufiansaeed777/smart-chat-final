import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { AppDataSource } from '@/config/database';
import { User } from '@/entities/User';
import { UserRole } from '@/types/UserRole';
import { EmailVerificationService } from '@/services/emailVerificationService';
import { checkRateLimit, getClientIdentifier, RateLimits } from '@/middleware/rateLimit';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting for signup attempts
    const identifier = getClientIdentifier(request);
    const rateLimitResponse = checkRateLimit(identifier, RateLimits.AUTH);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Initialize database connection only if not already initialized
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const { email, password, firstName, lastName } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const userRepository = AppDataSource.getRepository(User);
    const existingUser = await userRepository.findOne({ where: { email } });

    if (existingUser) {
      // If user exists and is verified, they can't re-register
      if (existingUser.isEmailVerified && existingUser.isActive) {
        return NextResponse.json(
          { 
            error: 'An account with this email already exists. Please try logging in instead.',
            code: 'EMAIL_EXISTS'
          },
          { status: 409 }
        );
      }
      
      // If user exists but is not verified, allow re-registration
      // Update their information and send new verification email
      const hashedPassword = await bcrypt.hash(password, 12);
      const verificationToken = EmailVerificationService.generateVerificationToken();
      
      // Update existing unverified user
      existingUser.password = hashedPassword;
      existingUser.firstName = firstName || null;
      existingUser.lastName = lastName || null;
      existingUser.isEmailVerified = false;
      existingUser.emailVerificationToken = verificationToken;
      existingUser.isActive = false;
      
      // All users who sign up become managers by default
      existingUser.role = UserRole.MANAGER;
      
      // Save updated user
      await userRepository.save(existingUser);
      
      // Generate verification URL
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;
      
      // Send verification email
      const emailSent = await EmailVerificationService.sendVerificationEmail(existingUser, verificationUrl);
      
      if (!emailSent) {
        return NextResponse.json(
          { error: 'Failed to send verification email. Please try again.' },
          { status: 500 }
        );
      }
      
      // Return success response for re-registration
      return NextResponse.json({
        message: 'Account updated successfully! Please check your email to verify your account.',
        userId: existingUser.id,
        email: existingUser.email
      }, { status: 200 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate verification token
    const verificationToken = EmailVerificationService.generateVerificationToken();

    // Create user (not verified yet)
    const user = new User();
    user.email = email;
    user.password = hashedPassword;
    user.firstName = firstName || null;
    user.lastName = lastName || null;
    user.isEmailVerified = false;
    user.emailVerificationToken = verificationToken;
    user.isActive = false; // User is inactive until email is verified
    user.role = UserRole.MANAGER; // All users who sign up become managers by default

    // Save user to database
    await userRepository.save(user);

    // Generate verification URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;

    // Send verification email
    const emailSent = await EmailVerificationService.sendVerificationEmail(user, verificationUrl);

    if (!emailSent) {
      // If email fails, delete the user and return error
      await userRepository.remove(user);
      return NextResponse.json(
        { error: 'Failed to send verification email. Please try again.' },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json({
      message: 'Account created successfully! Please check your email to verify your account.',
      userId: user.id,
      email: user.email
    }, { status: 201 });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
