import { NextResponse } from 'next/server';
import { AppDataSource } from '@/config/database';
import { HelpVideo } from '@/entities/HelpVideo';

// GET - Fetch all published videos (public)
export async function GET() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const videoRepository = AppDataSource.getRepository(HelpVideo);
    const videos = await videoRepository.find({
      where: { isPublished: true },
      order: { createdAt: 'DESC' }
    });

    return NextResponse.json({ videos });
  } catch (error) {
    console.error('Error fetching videos:', error);
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
  }
}
