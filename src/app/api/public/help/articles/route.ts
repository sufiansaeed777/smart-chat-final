import { NextResponse } from 'next/server';
import { AppDataSource } from '@/config/database';
import { HelpArticle } from '@/entities/HelpArticle';

// GET - Fetch all published articles (public)
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
