import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { HelpArticle } from '@/entities/HelpArticle';
import { User } from '@/entities/User';

// GET - Fetch all articles
export async function GET() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const articleRepository = AppDataSource.getRepository(HelpArticle);
    const articles = await articleRepository.find({
      where: { isPublished: true },
      order: { createdAt: 'DESC' }
    });

    return NextResponse.json({ articles });
  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
  }
}

// POST - Create new article (Admin only)
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

    const { title, content, category, description } = await request.json();

    if (!title || !content || !category) {
      return NextResponse.json({ error: 'Title, content, and category are required' }, { status: 400 });
    }

    const articleRepository = AppDataSource.getRepository(HelpArticle);
    const newArticle = articleRepository.create({
      title,
      content,
      category,
      description: description || '',
      isPublished: true
    });

    const savedArticle = await articleRepository.save(newArticle);

    return NextResponse.json({ article: savedArticle }, { status: 201 });
  } catch (error) {
    console.error('Error creating article:', error);
    return NextResponse.json({ error: 'Failed to create article' }, { status: 500 });
  }
}

// DELETE - Delete an article (Admin only)
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
      return NextResponse.json({ error: 'Article ID is required' }, { status: 400 });
    }

    const articleRepository = AppDataSource.getRepository(HelpArticle);
    await articleRepository.delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting article:', error);
    return NextResponse.json({ error: 'Failed to delete article' }, { status: 500 });
  }
}
