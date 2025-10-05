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

    // Check if admin already exists
    const existingAdmin = await userRepository.findOne({
      where: { email: 'admin@admin.com' }
    });

    if (existingAdmin) {
      // Update existing admin to ensure it has admin role
      existingAdmin.role = UserRole.ADMIN;
      existingAdmin.password = await bcrypt.hash('admin', 12);
      existingAdmin.isEmailVerified = true;
      existingAdmin.isActive = true;
      await userRepository.save(existingAdmin);
      
      return NextResponse.json({
        message: 'Admin account updated successfully',
        email: 'admin@admin.com',
        role: 'admin'
      });
    } else {
      // Create new admin account
      const hashedPassword = await bcrypt.hash('admin', 12);
      
      const admin = userRepository.create({
        email: 'admin@admin.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
        isEmailVerified: true,
        isActive: true
      });

      await userRepository.save(admin);
      
      return NextResponse.json({
        message: 'Admin account created successfully',
        email: 'admin@admin.com',
        role: 'admin'
      });
    }

  } catch (error) {
    console.error('Error creating admin account:', error);
    return NextResponse.json(
      { error: 'Failed to create admin account' },
      { status: 500 }
    );
  }
}
