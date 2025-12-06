'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { ArrowLeft, BookOpen, Users, FileText, BarChart3, Wrench, Calendar, Clock, ChevronRight } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

const categories = [
  { id: 'getting-started', label: 'Getting Started', icon: BookOpen, color: 'from-blue-500 to-blue-600' },
  { id: 'user-management', label: 'User Management', icon: Users, color: 'from-purple-500 to-purple-600' },
  { id: 'bot-creation', label: 'Bot Creation', icon: FileText, color: 'from-green-500 to-green-600' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'from-orange-500 to-orange-600' },
  { id: 'troubleshooting', label: 'Troubleshooting', icon: Wrench, color: 'from-red-500 to-red-600' }
];

const PublicArticleDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/public/help/articles/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.article) {
            setArticle(data.article);
          } else {
            setError('Article not found');
          }
        } else {
          setError('Failed to load article');
        }
      } catch (err) {
        console.error('Error fetching article:', err);
        setError('An error occurred while loading the article');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchArticle();
    }
  }, [params.id]);

  const handleBack = () => {
    router.push('/help');
  };

  const categoryInfo = article ? categories.find(c => c.id === article.category) : null;
  const CategoryIcon = categoryInfo?.icon || BookOpen;

  // Format content with paragraphs
  const formatContent = (content: string) => {
    return content.split('\n').filter(p => p.trim()).map((paragraph, index) => (
      <p key={index} className="text-[#6b7280] leading-relaxed mb-4">
        {paragraph}
      </p>
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navigation />
        <div className="flex-1 flex items-center justify-center pt-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6566F1]"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navigation />
        <div className="flex-1 flex flex-col items-center justify-center p-6 pt-24">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{error || 'Article not found'}</h2>
          <p className="text-gray-600 mb-6">The article you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <button
            onClick={handleBack}
            className="flex items-center space-x-2 px-6 py-3 bg-[#6566F1] text-white rounded-xl hover:bg-[#5A5BD9] transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Help Center</span>
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      <Navigation />

      {/* Header */}
      <header
        className="border-b pt-20"
        style={{
          background: 'linear-gradient(90deg, rgba(101,102,241,0.08), transparent)',
          borderColor: 'rgba(15,23,42,0.04)',
          padding: '24px 18px'
        }}
      >
        <div className="max-w-[980px] mx-auto px-4">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
            <Link href="/" className="hover:text-[#6566F1] transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/help" className="hover:text-[#6566F1] transition-colors">Help Center</Link>
            <ChevronRight className="w-4 h-4" />
            {categoryInfo && (
              <>
                <span className="text-gray-700">{categoryInfo.label}</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
            <span className="text-gray-900 font-medium truncate max-w-[200px]">{article.title}</span>
          </nav>

          {/* Back Button */}
          <button
            onClick={handleBack}
            className="flex items-center space-x-2 text-[#6566F1] hover:text-[#5A5BD9] transition-colors mb-6 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Help Center</span>
          </button>

          <div className="flex items-start gap-4">
            <div
              className={`w-[56px] h-[56px] rounded-xl flex items-center justify-center text-white bg-gradient-to-br ${categoryInfo?.color || 'from-[#6566F1] to-[#5A5BD9]'}`}
            >
              <CategoryIcon className="w-7 h-7" />
            </div>
            <div className="flex-1">
              {/* Category Badge */}
              {categoryInfo && (
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${categoryInfo.color} text-white mb-3`}>
                  {categoryInfo.label}
                </span>
              )}
              <h1 className="text-2xl md:text-[28px] font-bold text-[#0f172a] mb-2">{article.title}</h1>
              {article.description && (
                <p className="text-[#6b7280] text-base md:text-lg">{article.description}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[980px] mx-auto px-4 py-8 w-full">
        <article
          className="bg-white rounded-xl p-6 md:p-9"
          style={{
            boxShadow: '0 6px 18px rgba(2,6,23,0.06)',
            border: '1px solid rgba(2,6,23,0.04)'
          }}
        >
          {/* Article Content */}
          <div className="prose prose-gray max-w-none">
            {formatContent(article.content)}
          </div>

          {/* Article Footer */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex flex-wrap items-center gap-6 text-sm text-[#6b7280]">
              {article.createdAt && (
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Published: {new Date(article.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</span>
                </div>
              )}
              {article.updatedAt && (
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>Updated: {new Date(article.updatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</span>
                </div>
              )}
            </div>
          </div>
        </article>

        {/* Help Section */}
        <div
          className="mt-6 bg-white rounded-xl p-6"
          style={{
            boxShadow: '0 6px 18px rgba(2,6,23,0.06)',
            border: '1px solid rgba(2,6,23,0.04)'
          }}
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-lg font-semibold text-[#0f172a] mb-1">Was this article helpful?</h3>
              <p className="text-sm text-[#6b7280]">Let us know if you found what you were looking for.</p>
            </div>
            <div className="flex items-center space-x-3">
              <button className="px-5 py-2.5 rounded-xl font-medium text-sm bg-green-50 text-green-600 hover:bg-green-100 transition-colors border border-green-200">
                Yes, it helped
              </button>
              <button className="px-5 py-2.5 rounded-xl font-medium text-sm bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors border border-gray-200">
                No, I need more help
              </button>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-8 bg-gradient-to-r from-[#6566F1] to-[#5A5BD9] rounded-xl p-6 text-center text-white">
          <h3 className="text-lg font-bold mb-2">Ready to get started?</h3>
          <p className="text-white/80 mb-4">Create your first AI chatbot in minutes.</p>
          <Link
            href="/signup"
            className="inline-flex items-center px-6 py-3 bg-white text-[#6566F1] rounded-xl font-semibold hover:bg-gray-100 transition-colors"
          >
            Get Started Free
            <ChevronRight className="w-5 h-5 ml-1" />
          </Link>
        </div>

        {/* Back Button at Bottom */}
        <div className="mt-8 text-center">
          <button
            onClick={handleBack}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Help Center</span>
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PublicArticleDetailPage;
