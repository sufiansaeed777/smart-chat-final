import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { VideoLink } from '@/entities/VideoLink';
import { User } from '@/entities/User';

// GET - Fetch all video links
export async function GET() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const videoRepository = AppDataSource.getRepository(VideoLink);
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

// POST - Create new video link (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Check if user is admin
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { email: session.user.email }
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { title, url, category, description, thumbnail, duration } = await request.json();

    if (!title || !url || !category) {
      return NextResponse.json({ error: 'Title, URL, and category are required' }, { status: 400 });
    }

    const videoRepository = AppDataSource.getRepository(VideoLink);
    const newVideo = videoRepository.create({
      title,
      url,
      category,
      description: description || '',
      thumbnail: thumbnail || '',
      duration: duration || 0,
      isPublished: true
    });

    const savedVideo = await videoRepository.save(newVideo);

    return NextResponse.json({ video: savedVideo }, { status: 201 });
  } catch (error) {
    console.error('Error creating video:', error);
    return NextResponse.json({ error: 'Failed to create video' }, { status: 500 });
  }
}

// DELETE - Delete a video link (Admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Check if user is admin
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { email: session.user.email }
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }

    const videoRepository = AppDataSource.getRepository(VideoLink);
    await videoRepository.delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting video:', error);
    return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 });
  }
}
