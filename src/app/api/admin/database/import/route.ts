import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { User } from '@/entities/User';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

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
    const currentUser = await userRepository.findOne({
      where: { email: session.user.email }
    });

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Get the uploaded SQL file from form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.name.endsWith('.sql')) {
      return NextResponse.json({ error: 'Only .sql files are allowed' }, { status: 400 });
    }

    // Create temp directory if it doesn't exist
    const tempDir = path.join(process.cwd(), 'temp');
    try {
      await fs.access(tempDir);
    } catch {
      await fs.mkdir(tempDir, { recursive: true });
    }

    // Save uploaded file temporarily
    const tempFilePath = path.join(tempDir, `import-${Date.now()}.sql`);
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(tempFilePath, fileBuffer);

    // Get database connection details from environment
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      await fs.unlink(tempFilePath); // Clean up temp file
      return NextResponse.json({ error: 'Database URL not configured' }, { status: 500 });
    }

    // Parse database URL
    const urlMatch = dbUrl.match(/postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    if (!urlMatch) {
      await fs.unlink(tempFilePath);
      return NextResponse.json({ error: 'Invalid database URL format' }, { status: 500 });
    }

    const [, user, password, host, port, database] = urlMatch;

    // Use psql to import database
    const command = `PGPASSWORD="${password}" psql -h ${host} -p ${port} -U ${user} -d ${database} -f "${tempFilePath}"`;

    try {
      await execAsync(command);

      // Clean up temp file
      await fs.unlink(tempFilePath);

      return NextResponse.json({
        success: true,
        message: 'Database imported successfully'
      });
    } catch (error) {
      console.error('psql error:', error);
      await fs.unlink(tempFilePath); // Clean up temp file
      return NextResponse.json(
        { error: 'Database import failed. Ensure psql is installed and accessible.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error importing database:', error);
    return NextResponse.json(
      { error: 'Failed to import database' },
      { status: 500 }
    );
  }
}
