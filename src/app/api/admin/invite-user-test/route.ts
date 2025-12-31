import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { User } from '@/entities/User';
import crypto from 'crypto';
import { getUserPlanLimits, checkLimit } from '@/middleware/planLimits';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is manager or admin
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const userRepository = AppDataSource.getRepository(User);
    const currentUser = await userRepository.findOne({
      where: { email: session.user.email }
    });

    if (!currentUser || (currentUser.role !== 'manager' && currentUser.role !== 'admin')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Check plan limits for team members (skip for admin users)
    if (currentUser.role === 'manager') {
      const currentUserCount = await userRepository.count({
        where: { invitedBy: currentUser.id }
      });

      const userPlan = currentUser.subscriptionPlan ?? 'free';
      const planLimits = getUserPlanLimits(userPlan);
      const limitCheck = checkLimit(currentUserCount, planLimits.maxUsers, 'users');

      console.log(`[Plan Check] User: ${currentUser.email}, Plan: ${userPlan}, Team Members: ${currentUserCount}/${planLimits.maxUsers}`);

      if (!limitCheck.allowed) {
        return NextResponse.json({
          error: 'Plan limit reached',
          message: limitCheck.message,
          currentCount: currentUserCount,
          limit: planLimits.maxUsers,
          plan: userPlan,
          upgradeRequired: true,
          upgradeUrl: '/manager-dashboard/billing'
        }, { status: 403 });
      }
    }

    const { email, name, role } = await request.json();

    if (!email || !name) {
      return NextResponse.json({ error: 'Email and name are required' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await userRepository.findOne({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    // Generate invitation token
    const invitationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user with invitation token
    const newUser = userRepository.create({
      email,
      firstName: name.split(' ')[0] || name,
      lastName: name.split(' ').slice(1).join(' ') || '',
      role: role || 'user',
      isEmailVerified: false,
      invitationToken,
      tokenExpiry,
      invitedBy: currentUser.id,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await userRepository.save(newUser);

    // Log the invitation details instead of sending email
    const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/verify-invitation?token=${invitationToken}`;
    
    console.log('=== INVITATION CREATED ===');
    console.log('User:', name, email);
    console.log('Role:', role);
    console.log('Invited by:', currentUser.firstName, currentUser.lastName);
    console.log('Verification URL:', verificationUrl);
    console.log('Token expires:', tokenExpiry);
    console.log('========================');

    return NextResponse.json({ 
      message: 'Invitation created successfully (check console for details)',
      userId: newUser.id,
      verificationUrl: verificationUrl // Include URL in response for testing
    });

  } catch (error) {
    console.error('Error creating invitation:', error);
    return NextResponse.json(
      { error: 'Failed to create invitation' },
      { status: 500 }
    );
  }
}
