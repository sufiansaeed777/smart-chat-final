import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/config/database';
import { HelpArticle } from '@/entities/HelpArticle';

// GET - Fetch a single article by ID (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const articleRepository = AppDataSource.getRepository(HelpArticle);
    const article = await articleRepository.findOne({
      where: { id, isPublished: true }
    });

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    return NextResponse.json({ article });
  } catch (error) {
    console.error('Error fetching article:', error);
    return NextResponse.json({ error: 'Failed to fetch article' }, { status: 500 });
  }
}
