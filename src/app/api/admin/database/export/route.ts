import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create exports directory if it doesn't exist
    const exportDir = path.join(process.cwd(), 'exports');
    try {
      await fs.access(exportDir);
    } catch {
      await fs.mkdir(exportDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportPath = path.join(exportDir, `database-export-${timestamp}.sql`);

    // Get database connection details from environment
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      return NextResponse.json({ error: 'Database URL not configured' }, { status: 500 });
    }

    // Parse database URL (format: postgres://user:password@host:port/dbname)
    const urlMatch = dbUrl.match(/postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    if (!urlMatch) {
      return NextResponse.json({ error: 'Invalid database URL format' }, { status: 500 });
    }

    const [, user, password, host, port, database] = urlMatch;

    // Use pg_dump to export database
    const command = `PGPASSWORD="${password}" pg_dump -h ${host} -p ${port} -U ${user} -d ${database} -f "${exportPath}"`;

    try {
      await execAsync(command);

      // Read the exported file
      const exportData = await fs.readFile(exportPath, 'utf-8');

      // Return the file as download
      return new NextResponse(exportData, {
        headers: {
          'Content-Type': 'application/sql',
          'Content-Disposition': `attachment; filename="database-export-${timestamp}.sql"`,
        },
      });
    } catch (error) {
      console.error('pg_dump error:', error);
      return NextResponse.json(
        { error: 'Database export failed. Ensure pg_dump is installed and accessible.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error exporting database:', error);
    return NextResponse.json(
      { error: 'Failed to export database' },
      { status: 500 }
    );
  }
}
