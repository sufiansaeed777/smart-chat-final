import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { User } from '@/entities/User';

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Get the current user to check if they're a manager
    const currentUser = await AppDataSource.getRepository(User).findOne({
      where: { email: session.user.email }
    });

    if (!currentUser || currentUser.role !== 'manager') {
      return NextResponse.json({ error: 'Forbidden - Manager access required' }, { status: 403 });
    }

    const { userId, currentStatus } = await request.json();

    if (!userId || !currentStatus) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate currentStatus
    if (!['accepted', 'pending'].includes(currentStatus)) {
      return NextResponse.json({ error: 'Invalid current status' }, { status: 400 });
    }

    // Get the user to toggle
    const userRepository = AppDataSource.getRepository(User);
    const userToToggle = await userRepository.findOne({
      where: { id: userId }
    });

    if (!userToToggle) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Ensure the user belongs to this manager
    if (userToToggle.invitedBy !== currentUser.id) {
      return NextResponse.json({ error: 'You can only manage users you invited' }, { status: 403 });
    }

    // Toggle the user status by setting/clearing password
    const newStatus = currentStatus === 'accepted' ? 'pending' : 'accepted';
    
    // Use database transaction to ensure atomicity
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (newStatus === 'pending') {
        // Store the original password hash in emailVerificationToken before deactivating
        const originalPassword = userToToggle.password;
        const updateResult = await queryRunner.manager.update(User, 
          { id: userId },
          { 
            password: null,
            isActive: false,
            // Keep lastLoginAt to distinguish between never-activated and deactivated users
            emailVerificationToken: originalPassword // Store original password for reactivation
          }
        );

        // Verify the update was successful
        if (updateResult.affected === 0) {
          throw new Error('Failed to deactivate user - no rows affected');
        }

        console.log(`User ${userToToggle.email} has been deactivated and should be logged out immediately`);
        
      } else {
        // For reactivation, restore the original password from emailVerificationToken
        const originalPassword = userToToggle.emailVerificationToken;
        const updateResult = await queryRunner.manager.update(User,
          { id: userId },
          { 
            password: originalPassword, // Restore original password
            isActive: true,
            emailVerificationToken: null // Clear the stored password
          }
        );

        // Verify the update was successful
        if (updateResult.affected === 0) {
          throw new Error('Failed to activate user - no rows affected');
        }

        console.log(`User ${userToToggle.email} has been activated with original password restored`);
      }

      // Commit the transaction
      await queryRunner.commitTransaction();

      // Verify the final state
      const updatedUser = await userRepository.findOne({
        where: { id: userId },
        select: ['id', 'email', 'isActive', 'password']
      });

      if (!updatedUser) {
        throw new Error('Failed to verify user state after update');
      }

      // Log the final state for debugging
      console.log(`User ${updatedUser.email} final state:`, {
        isActive: updatedUser.isActive,
        hasPassword: !!updatedUser.password
      });

      return NextResponse.json({ 
        success: true, 
        message: `User ${newStatus === 'accepted' ? 'activated' : 'deactivated'} successfully`,
        newStatus,
        userState: {
          isActive: updatedUser.isActive,
          hasPassword: !!updatedUser.password
        }
      });

    } catch (error) {
      // Rollback the transaction on error
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release the query runner
      await queryRunner.release();
    }

  } catch (error) {
    console.error('Error toggling user status:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
