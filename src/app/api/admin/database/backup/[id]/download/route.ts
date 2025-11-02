import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const backupId = params.id;
    const backupDir = path.join(process.cwd(), 'backups');
    const backupPath = path.join(backupDir, `${backupId}.sql`);

    // Check if backup file exists
    try {
      await fs.access(backupPath);
    } catch {
      return NextResponse.json({ error: 'Backup file not found' }, { status: 404 });
    }

    // Read backup file
    const backupData = await fs.readFile(backupPath, 'utf-8');

    // Return file as downloadable
    return new NextResponse(backupData, {
      headers: {
        'Content-Type': 'application/sql',
        'Content-Disposition': `attachment; filename="backup-${backupId}.sql"`,
      },
    });

  } catch (error) {
    console.error('Error downloading backup:', error);
    return NextResponse.json(
      { error: 'Failed to download backup' },
      { status: 500 }
    );
  }
}
