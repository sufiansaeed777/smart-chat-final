'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import {
  Search,
  Wrench,
  ChevronRight,
  ArrowLeft,
  BookOpen,
  Loader2
} from 'lucide-react';

interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  description?: string;
}

const TroubleshootingPage = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch troubleshooting articles from API
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/public/help/articles');
        if (response.ok) {
          const data = await response.json();
          // Filter only troubleshooting articles
          const troubleshootingArticles = (data.articles || []).filter(
            (article: Article) => article.category === 'troubleshooting'
          );
          setArticles(troubleshootingArticles);
        }
      } catch (error) {
        console.error('Error fetching articles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  // Filter articles based on search
  const filteredArticles = articles.filter(article => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      article.title.toLowerCase().includes(search) ||
      article.content.toLowerCase().includes(search) ||
      (article.description && article.description.toLowerCase().includes(search))
    );
  });

  // Navigate to article detail page
  const handleArticleClick = (articleId: string) => {
    router.push(`/help/article/${articleId}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navigation />

      {/* Hero Section */}
      <div className="pt-24 pb-12 bg-gradient-to-b from-red-50 to-gray-50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl mx-auto">
            {/* Back Link */}
            <Link
              href="/support"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Support
            </Link>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Wrench className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Troubleshooting</h1>
              <p className="text-xl text-gray-600 mb-8">
                Find solutions to common issues and get your chatbot back on track
              </p>

              {/* Search Bar */}
              <div className="relative max-w-xl mx-auto">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search troubleshooting articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500 transition-all duration-200 shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Articles Section */}
      <div className="container mx-auto px-4 lg:px-8 py-12 flex-1">
        <div className="max-w-4xl mx-auto">
          {/* Results Count */}
          <div className="mb-6">
            <p className="text-gray-600">
              {loading ? 'Loading...' : `${filteredArticles.length} article${filteredArticles.length !== 1 ? 's' : ''} found`}
            </p>
          </div>

          {/* Articles List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No articles found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm
                  ? 'Try adjusting your search terms'
                  : 'No troubleshooting articles available yet'}
              </p>
              <Link
                href="/contact-support"
                className="inline-flex items-center text-red-600 hover:text-red-700 font-medium"
              >
                Contact Support
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredArticles.map((article) => (
                <div
                  key={article.id}
                  onClick={() => handleArticleClick(article.id)}
                  className="group bg-white border border-gray-200 rounded-xl p-6 hover:border-red-500 hover:shadow-md transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-red-500 to-red-600 text-white">
                          Troubleshooting
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-red-600 transition-colors">
                        {article.title}
                      </h3>
                      {article.description && (
                        <p className="text-sm text-gray-500 mb-2">{article.description}</p>
                      )}
                      <p className="text-gray-600 text-sm line-clamp-2">{article.content}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-red-600 group-hover:translate-x-1 transition-all duration-200 ml-4 flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CTA Section */}
          <div className="mt-12 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-8 text-center text-white">
            <h2 className="text-2xl font-bold mb-4">Still having issues?</h2>
            <p className="text-white/80 mb-6 max-w-2xl mx-auto">
              If you can&apos;t find a solution to your problem, our support team is here to help.
            </p>
            <Link
              href="/contact-support"
              className="inline-flex items-center px-6 py-3 bg-white text-red-600 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
            >
              Contact Support
              <ChevronRight className="w-5 h-5 ml-1" />
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default TroubleshootingPage;
