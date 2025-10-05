import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { AppDataSource } from '@/config/database';
import { User } from '@/entities/User';
import { UserRole } from '@/types/UserRole';

export async function POST(request: NextRequest) {
  try {
    // Initialize database connection only if not already initialized
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    
    const userRepository = AppDataSource.getRepository("users");

    // Check if manager already exists
    const existingManager = await userRepository.findOne({
      where: { email: 'manager@manager.com' }
    });

    if (existingManager) {
      // Update existing manager to ensure it has manager role
      existingManager.role = UserRole.MANAGER;
      existingManager.password = await bcrypt.hash('manager', 12);
      existingManager.isEmailVerified = true;
      existingManager.isActive = true;
      await userRepository.save(existingManager);
      
      return NextResponse.json({
        message: 'Manager account updated successfully',
        email: 'manager@manager.com',
        role: 'manager'
      });
    } else {
      // Create new manager account
      const hashedPassword = await bcrypt.hash('manager', 12);
      
      const manager = userRepository.create({
        email: 'manager@manager.com',
        password: hashedPassword,
        firstName: 'Manager',
        lastName: 'User',
        role: UserRole.MANAGER,
        isEmailVerified: true,
        isActive: true
      });

      await userRepository.save(manager);
      
      return NextResponse.json({
        message: 'Manager account created successfully',
        email: 'manager@manager.com',
        role: 'manager'
      });
    }

  } catch (error) {
    console.error('Error creating manager account:', error);
    return NextResponse.json(
      { error: 'Failed to create manager account' },
      { status: 500 }
    );
  }
}
