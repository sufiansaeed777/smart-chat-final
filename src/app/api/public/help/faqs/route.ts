import { NextResponse } from 'next/server';
import { AppDataSource } from '@/config/database';
import { HelpFAQ } from '@/entities/HelpFAQ';

// GET - Fetch all published FAQs (public)
export async function GET() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const faqRepository = AppDataSource.getRepository(HelpFAQ);
    const faqs = await faqRepository.find({
      where: { isPublished: true },
      order: { createdAt: 'DESC' }
    });

    return NextResponse.json({ faqs });
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    return NextResponse.json({ error: 'Failed to fetch FAQs' }, { status: 500 });
  }
}
