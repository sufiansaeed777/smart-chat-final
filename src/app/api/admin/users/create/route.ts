import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
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
      where: { email: session.user.email.toLowerCase() }
    });

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { email, firstName, lastName, role, password } = await request.json();

    // Validate required fields
    if (!email || !firstName || !lastName || !role) {
      return NextResponse.json({ error: 'Missing required fields: email, firstName, lastName, and role are required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Validate role
    const validRoles = ['admin', 'manager', 'user'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role. Must be: admin, manager, or user' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await userRepository.findOne({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
    }

    // Use provided password or generate a default one
    const defaultPassword = password || 'ChangeMe123!';
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    // Create new user
    const newUser = userRepository.create({
      email: email.toLowerCase(),
      firstName,
      lastName,
      role,
      password: hashedPassword,
      isEmailVerified: false,
      isActive: true
    });

    const savedUser = await userRepository.save(newUser);

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: {
        id: savedUser.id,
        email: savedUser.email,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        role: savedUser.role,
        isActive: savedUser.isActive,
        createdAt: savedUser.createdAt
      },
      defaultPassword: password ? undefined : defaultPassword
    });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
