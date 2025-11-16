import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { FAQ } from '@/entities/FAQ';
import { User } from '@/entities/User';

// GET - Fetch all FAQs
export async function GET() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const faqRepository = AppDataSource.getRepository(FAQ);
    const faqs = await faqRepository.find({
      where: { isPublished: true },
      order: { orderIndex: 'ASC', createdAt: 'DESC' }
    });

    return NextResponse.json({ faqs });
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    return NextResponse.json({ error: 'Failed to fetch FAQs' }, { status: 500 });
  }
}

// POST - Create new FAQ (Admin only)
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

    const { question, answer, category, orderIndex } = await request.json();

    if (!question || !answer || !category) {
      return NextResponse.json({ error: 'Question, answer, and category are required' }, { status: 400 });
    }

    const faqRepository = AppDataSource.getRepository(FAQ);
    const newFaq = faqRepository.create({
      question,
      answer,
      category,
      orderIndex: orderIndex || 0,
      isPublished: true
    });

    const savedFaq = await faqRepository.save(newFaq);

    return NextResponse.json({ faq: savedFaq }, { status: 201 });
  } catch (error) {
    console.error('Error creating FAQ:', error);
    return NextResponse.json({ error: 'Failed to create FAQ' }, { status: 500 });
  }
}

// DELETE - Delete an FAQ (Admin only)
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
      return NextResponse.json({ error: 'FAQ ID is required' }, { status: 400 });
    }

    const faqRepository = AppDataSource.getRepository(FAQ);
    await faqRepository.delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    return NextResponse.json({ error: 'Failed to delete FAQ' }, { status: 500 });
  }
}
