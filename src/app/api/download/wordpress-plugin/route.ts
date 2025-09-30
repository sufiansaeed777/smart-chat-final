import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Path to the WordPress plugin folder
    const pluginPath = path.join(process.cwd(), 'wordpress-plugin', 'synofex-chatbot');

    // Check if plugin folder exists
    if (!fs.existsSync(pluginPath)) {
      console.error('Plugin folder not found at:', pluginPath);
      return NextResponse.json({ error: 'Plugin folder not found' }, { status: 404 });
    }

    // Create a buffer to store the zip
    const chunks: Buffer[] = [];

    // Create archive
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    // Handle archive errors
    archive.on('error', (err) => {
      console.error('Archive error:', err);
      throw err;
    });

    // Collect data
    archive.on('data', (chunk) => {
      chunks.push(chunk);
    });

    // Wait for archive to finish
    const finishPromise = new Promise<Buffer>((resolve) => {
      archive.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
    });

    // Add the plugin folder to archive
    archive.directory(pluginPath, 'synofex-chatbot');

    // Finalize the archive
    archive.finalize();

    // Get the final buffer
    const zipBuffer = await finishPromise;

    // Return the zip file as a download
    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename=synofex-chatbot.zip',
        'Content-Length': zipBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error creating plugin zip:', error);
    return NextResponse.json(
      { error: 'Failed to create plugin download' },
      { status: 500 }
    );
  }
}