'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import {
  Search,
  BookOpen,
  ChevronRight,
  ArrowLeft,
  FileText,
  Users,
  BarChart3,
  Wrench,
  Loader2
} from 'lucide-react';

interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  description?: string;
}

const categories = [
  { id: 'getting-started', label: 'Getting Started', icon: BookOpen, color: 'from-blue-500 to-blue-600' },
  { id: 'user-management', label: 'User Management', icon: Users, color: 'from-purple-500 to-purple-600' },
  { id: 'bot-creation', label: 'Bot Creation', icon: FileText, color: 'from-green-500 to-green-600' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'from-orange-500 to-orange-600' },
  { id: 'troubleshooting', label: 'Troubleshooting', icon: Wrench, color: 'from-red-500 to-red-600' }
];

const KnowledgeBasePage = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch articles from API
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/public/help/articles');
        if (response.ok) {
          const data = await response.json();
          setArticles(data.articles || []);
        }
      } catch (error) {
        console.error('Error fetching articles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  // Filter articles based on search and category
  const filteredArticles = articles.filter(article => {
    const matchesCategory = !activeCategory || article.category === activeCategory;
    const matchesSearch = !searchTerm ||
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (article.description && article.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Get category counts
  const getCategoryCounts = () => {
    const counts: { [key: string]: number } = {};
    categories.forEach(cat => {
      counts[cat.id] = articles.filter(article => {
        const matchesCategory = article.category === cat.id;
        const matchesSearch = !searchTerm ||
          article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          article.content.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
      }).length;
    });
    return counts;
  };

  const categoryCounts = getCategoryCounts();

  // Navigate to article detail page
  const handleArticleClick = (articleId: string) => {
    router.push(`/help/article/${articleId}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navigation />

      {/* Hero Section */}
      <div className="pt-24 pb-12 bg-gradient-to-b from-purple-50 to-gray-50">
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
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Knowledge Base</h1>
              <p className="text-xl text-gray-600 mb-8">
                Browse articles, tutorials, and best practices to get the most out of Smart Chat
              </p>

              {/* Search Bar */}
              <div className="relative max-w-xl mx-auto">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search knowledge base..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500 transition-all duration-200 shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-4 lg:px-8 py-12 flex-1">
        <div className="max-w-5xl mx-auto">
          {/* Category Filters */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 overflow-x-auto pb-2">
              <button
                onClick={() => setActiveCategory(null)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 whitespace-nowrap ${
                  !activeCategory
                    ? 'bg-[#6566F1] text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <span>All Articles</span>
                <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                  !activeCategory ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {filteredArticles.length}
                </span>
              </button>

              {categories.map((category) => {
                const Icon = category.icon;
                const isActive = activeCategory === category.id;
                const count = categoryCounts[category.id] || 0;
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(isActive ? null : category.id)}
                    className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 whitespace-nowrap ${
                      isActive
                        ? `bg-gradient-to-r ${category.color} text-white shadow-lg`
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{category.label}</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-6">
            <p className="text-gray-600">
              {loading ? 'Loading...' : `${filteredArticles.length} article${filteredArticles.length !== 1 ? 's' : ''} found`}
              {activeCategory && ` in ${categories.find(c => c.id === activeCategory)?.label}`}
            </p>
          </div>

          {/* Articles Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No articles found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || activeCategory
                  ? 'Try adjusting your search or filter'
                  : 'No articles available yet'}
              </p>
              {(searchTerm || activeCategory) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setActiveCategory(null);
                  }}
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredArticles.map((article) => {
                const categoryInfo = categories.find(c => c.id === article.category);
                return (
                  <div
                    key={article.id}
                    onClick={() => handleArticleClick(article.id)}
                    className="group bg-white border border-gray-200 rounded-xl p-5 hover:border-purple-500 hover:shadow-md transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          {categoryInfo && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r ${categoryInfo.color} text-white`}>
                              {categoryInfo.label}
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                          {article.title}
                        </h3>
                        {article.description && (
                          <p className="text-sm text-gray-500 mb-2">{article.description}</p>
                        )}
                        <p className="text-gray-600 text-sm line-clamp-2">{article.content}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all duration-200 ml-3 flex-shrink-0" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* CTA Section */}
          <div className="mt-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-8 text-center text-white">
            <h2 className="text-2xl font-bold mb-4">Can&apos;t find what you&apos;re looking for?</h2>
            <p className="text-white/80 mb-6 max-w-2xl mx-auto">
              Our support team is ready to help you with any questions.
            </p>
            <Link
              href="/contact-support"
              className="inline-flex items-center px-6 py-3 bg-white text-purple-600 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
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

export default KnowledgeBasePage;
