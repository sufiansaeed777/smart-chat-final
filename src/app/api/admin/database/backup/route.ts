import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { User } from '@/entities/User';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { email: session.user.email }
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { type } = await request.json();
    const backupType = type || 'full';

    // Determine backup directory based on environment
    // In serverless environments (Vercel, Lambda), use /tmp (only writable directory)
    // In traditional hosting, use process.cwd()/backups
    const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;

    // Check if running on Vercel/serverless - pg_dump won't be available
    if (isServerless) {
      return NextResponse.json({
        error: 'Database backups are not supported in serverless environments',
        details: 'pg_dump command-line tool is not available on Vercel',
        suggestion: 'Please use your database provider\'s backup features (e.g., Supabase, Neon, or Railway automated backups) or run backups from a traditional server environment.'
      }, { status: 501 });
    }
    const backupDir = isServerless
      ? path.join('/tmp', 'backups')
      : path.join(process.cwd(), 'backups');

    // Create backups directory if it doesn't exist
    try {
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
    } catch (dirError) {
      console.error('Error creating backup directory:', dirError);
      return NextResponse.json({
        error: 'Cannot create backup directory. This may be a serverless environment limitation.',
        details: dirError instanceof Error ? dirError.message : 'Unknown error',
        suggestion: 'Consider using an external backup service or database provider backups.'
      }, { status: 500 });
    }

    // Generate backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `backup-${backupType}-${timestamp}.sql`);

    // Get database connection details from environment
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      return NextResponse.json({ error: 'Database URL not configured' }, { status: 500 });
    }

    // Parse database URL
    const url = new URL(databaseUrl);
    const dbUser = url.username;
    const dbPassword = url.password;
    const dbHost = url.hostname;
    const dbPort = url.port || '5432';
    const dbName = url.pathname.slice(1);

    // Create pg_dump command
    const pgDumpCommand = `PGPASSWORD="${dbPassword}" pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -F p -f "${backupFile}"`;

    try {
      // Execute backup
      await execAsync(pgDumpCommand);

      // Get file size
      const stats = fs.statSync(backupFile);
      const fileSizeInBytes = stats.size;
      const fileSizeInMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2);

      return NextResponse.json({
        success: true,
        message: 'Backup created successfully',
        backup: {
          id: timestamp,
          name: `backup-${backupType}-${timestamp}.sql`,
          type: backupType,
          size: `${fileSizeInMB} MB`,
          path: backupFile,
          createdAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Backup creation error:', error);
      return NextResponse.json({
        error: 'Failed to create backup',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error creating backup:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get list of backups
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { email: session.user.email }
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Use same directory logic as POST
    const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
    const backupDir = isServerless
      ? path.join('/tmp', 'backups')
      : path.join(process.cwd(), 'backups');

    if (!fs.existsSync(backupDir)) {
      return NextResponse.json({
        success: true,
        backups: []
      });
    }

    const files = fs.readdirSync(backupDir);
    const backups = files
      .filter(file => file.endsWith('.sql'))
      .map(file => {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

        const match = file.match(/backup-(full|incremental)-(.+)\.sql/);
        const type = match ? match[1] : 'full';
        const id = match ? match[2] : file;

        return {
          id,
          name: file,
          type,
          size: `${fileSizeInMB} MB`,
          createdAt: stats.mtime.toISOString(),
          status: 'completed'
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      success: true,
      backups
    });

  } catch (error) {
    console.error('Error fetching backups:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete a backup
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { email: session.user.email }
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { backupId } = await request.json();

    if (!backupId) {
      return NextResponse.json({ error: 'Backup ID is required' }, { status: 400 });
    }

    // Use same directory logic as POST
    const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
    const backupDir = isServerless
      ? path.join('/tmp', 'backups')
      : path.join(process.cwd(), 'backups');

    // Check if backup directory exists
    if (!fs.existsSync(backupDir)) {
      return NextResponse.json({ error: 'No backups directory found' }, { status: 404 });
    }

    // Find the backup file
    const files = fs.readdirSync(backupDir);
    const backupFile = files.find(file => {
      const match = file.match(/backup-(full|incremental)-(.+)\.sql/);
      return match && match[2] === backupId;
    });

    if (!backupFile) {
      return NextResponse.json({ error: 'Backup not found' }, { status: 404 });
    }

    const filePath = path.join(backupDir, backupFile);

    try {
      fs.unlinkSync(filePath);

      return NextResponse.json({
        success: true,
        message: 'Backup deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting backup file:', error);
      return NextResponse.json({
        error: 'Failed to delete backup file',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error deleting backup:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
