import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AppDataSource } from '@/config/database';
import { User } from '@/entities/User';
import { BotAssignment } from '@/entities/BotAssignment';

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Get current user from database
    const userRepository = AppDataSource.getRepository(User);
    const currentUser = await userRepository.findOne({ 
      where: { email: session.user.email } 
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is a manager
    if (currentUser.role !== 'manager') {
      return NextResponse.json({ error: 'Only managers can delete users' }, { status: 403 });
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ 
        error: 'User ID is required' 
      }, { status: 400 });
    }

    // Get the user to delete
    const userToDelete = await userRepository.findOne({
      where: { 
        id: userId,
        invitedBy: currentUser.id // Ensure the manager invited this user
      }
    });

    if (!userToDelete) {
      return NextResponse.json({ 
        error: 'User not found or you do not have permission to delete them' 
      }, { status: 404 });
    }

    // Prevent managers from deleting other managers or admins
    if (userToDelete.role === 'manager' || userToDelete.role === 'admin') {
      return NextResponse.json({ 
        error: 'Cannot delete users with manager or admin roles' 
      }, { status: 403 });
    }

    // Delete all bot assignments for this user first
    const assignmentRepository = AppDataSource.getRepository(BotAssignment);
    await assignmentRepository.delete({ user: { id: userId } });

    // Delete the user
    await userRepository.delete({ id: userId });

    return NextResponse.json({
      message: 'User deleted successfully',
      userId: userId
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
