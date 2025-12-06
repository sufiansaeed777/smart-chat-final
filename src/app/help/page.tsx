'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import {
  HelpCircle,
  Search,
  BookOpen,
  Video,
  FileText,
  ExternalLink,
  ChevronRight,
  Users,
  BarChart3,
  Wrench,
  Play,
  ArrowRight
} from 'lucide-react';

interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  description?: string;
}

interface VideoLinkType {
  id: string;
  title: string;
  url: string;
  category: string;
  description?: string;
  thumbnail?: string;
  duration?: number;
}

interface FAQType {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const PublicHelpPage = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'articles' | 'videos' | 'faqs'>('articles');
  const [articles, setArticles] = useState<Article[]>([]);
  const [videos, setVideos] = useState<VideoLinkType[]>([]);
  const [faqs, setFaqs] = useState<FAQType[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const categories = [
    { id: 'getting-started', label: 'Getting Started', icon: BookOpen, color: 'from-blue-500 to-blue-600' },
    { id: 'user-management', label: 'User Management', icon: Users, color: 'from-purple-500 to-purple-600' },
    { id: 'bot-creation', label: 'Bot Creation', icon: FileText, color: 'from-green-500 to-green-600' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'from-orange-500 to-orange-600' },
    { id: 'troubleshooting', label: 'Troubleshooting', icon: Wrench, color: 'from-red-500 to-red-600' }
  ];

  const contentTabs = [
    { id: 'articles', label: 'Articles', icon: BookOpen },
    { id: 'videos', label: 'Videos', icon: Video },
    { id: 'faqs', label: 'FAQs', icon: HelpCircle }
  ];

  // Fetch help content from public API
  useEffect(() => {
    const fetchHelpContent = async () => {
      try {
        setLoading(true);
        const [articlesRes, videosRes, faqsRes] = await Promise.all([
          fetch('/api/public/help/articles'),
          fetch('/api/public/help/videos'),
          fetch('/api/public/help/faqs')
        ]);

        if (articlesRes.ok) {
          const data = await articlesRes.json();
          setArticles(data.articles || []);
        }
        if (videosRes.ok) {
          const data = await videosRes.json();
          setVideos(data.videos || []);
        }
        if (faqsRes.ok) {
          const data = await faqsRes.json();
          setFaqs(data.faqs || []);
        }
      } catch (error) {
        console.error('Error fetching help content:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHelpContent();
  }, []);

  // Filter content based on search and category
  const getFilteredContent = <T extends { category: string }>(
    items: T[],
    searchFields: (item: T) => string[]
  ) => {
    return items.filter(item => {
      const matchesCategory = !activeCategory || item.category === activeCategory;
      const matchesSearch = !searchTerm || searchFields(item).some(
        field => field.toLowerCase().includes(searchTerm.toLowerCase())
      );
      return matchesCategory && matchesSearch;
    });
  };

  const filteredArticles = getFilteredContent(articles, (a) => [a.title, a.content, a.description || '']);
  const filteredVideos = getFilteredContent(videos, (v) => [v.title, v.description || '']);
  const filteredFaqs = getFilteredContent(faqs, (f) => [f.question, f.answer]);

  // Get counts per category for current tab
  const getCategoryCounts = () => {
    const items = activeTab === 'articles' ? articles : activeTab === 'videos' ? videos : faqs;
    const counts: { [key: string]: number } = {};
    categories.forEach(cat => {
      counts[cat.id] = items.filter(item => {
        const matchesCategory = item.category === cat.id;
        const matchesSearch = !searchTerm || (
          activeTab === 'articles' ? [(item as Article).title, (item as Article).content].some(f => f.toLowerCase().includes(searchTerm.toLowerCase())) :
          activeTab === 'videos' ? [(item as VideoLinkType).title, (item as VideoLinkType).description || ''].some(f => f.toLowerCase().includes(searchTerm.toLowerCase())) :
          [(item as FAQType).question, (item as FAQType).answer].some(f => f.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        return matchesCategory && matchesSearch;
      }).length;
    });
    return counts;
  };

  const categoryCounts = getCategoryCounts();

  // Get total count for current tab
  const getTotalCount = () => {
    if (activeTab === 'articles') return filteredArticles.length;
    if (activeTab === 'videos') return filteredVideos.length;
    return filteredFaqs.length;
  };

  // Navigate to article detail page
  const handleArticleClick = (articleId: string) => {
    router.push(`/help/article/${articleId}`);
  };

  // Get articles by category for quick access
  const gettingStartedArticles = articles.filter(a => a.category === 'getting-started').slice(0, 3);
  const troubleshootingArticles = articles.filter(a => a.category === 'troubleshooting').slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <div className="pt-24 pb-12 bg-gradient-to-b from-[#6566F1]/10 to-gray-50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Help Center</h1>
            <p className="text-xl text-gray-600 mb-8">
              Find answers, tutorials, and guides to help you get the most out of Smart Chat
            </p>

            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search for help articles, FAQs, and guides..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#6566F1] focus:border-transparent bg-white text-gray-900 placeholder-gray-500 transition-all duration-200 shadow-lg"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Access Sections */}
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Getting Started Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-blue-500 to-blue-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Getting Started</h2>
                    <p className="text-blue-100 text-sm">Learn the basics</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setActiveCategory('getting-started');
                    setActiveTab('articles');
                  }}
                  className="flex items-center text-white/80 hover:text-white text-sm font-medium"
                >
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
            <div className="p-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#6566F1]"></div>
                </div>
              ) : gettingStartedArticles.length > 0 ? (
                <div className="space-y-2">
                  {gettingStartedArticles.map((article) => (
                    <button
                      key={article.id}
                      onClick={() => handleArticleClick(article.id)}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group text-left"
                    >
                      <span className="text-gray-700 group-hover:text-[#6566F1] font-medium">{article.title}</span>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#6566F1] group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No articles available yet.</p>
              )}
            </div>
          </div>

          {/* Troubleshooting Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-red-500 to-red-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                    <Wrench className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Troubleshooting</h2>
                    <p className="text-red-100 text-sm">Fix common issues</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setActiveCategory('troubleshooting');
                    setActiveTab('articles');
                  }}
                  className="flex items-center text-white/80 hover:text-white text-sm font-medium"
                >
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
            <div className="p-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#6566F1]"></div>
                </div>
              ) : troubleshootingArticles.length > 0 ? (
                <div className="space-y-2">
                  {troubleshootingArticles.map((article) => (
                    <button
                      key={article.id}
                      onClick={() => handleArticleClick(article.id)}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group text-left"
                    >
                      <span className="text-gray-700 group-hover:text-[#6566F1] font-medium">{article.title}</span>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#6566F1] group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No articles available yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Knowledge Base Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-12">
          <div className="p-6 bg-gradient-to-r from-purple-500 to-purple-600">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Knowledge Base</h2>
                <p className="text-purple-100 text-sm">Browse all help resources</p>
              </div>
            </div>
          </div>

          {/* Content Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex">
              {contentTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const count = tab.id === 'articles' ? articles.length : tab.id === 'videos' ? videos.length : faqs.length;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as 'articles' | 'videos' | 'faqs');
                      setActiveCategory(null);
                    }}
                    className={`flex-1 flex items-center justify-center space-x-2 px-6 py-4 font-medium transition-all duration-200 ${
                      isActive
                        ? 'text-[#6566F1] border-b-2 border-[#6566F1] bg-[#6566F1]/5'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      isActive ? 'bg-[#6566F1] text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Categories */}
            <div className="mb-6">
              <div className="flex items-center space-x-3 overflow-x-auto pb-2">
                <button
                  onClick={() => setActiveCategory(null)}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 whitespace-nowrap ${
                    !activeCategory
                      ? 'bg-[#6566F1] text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span>All</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                    !activeCategory ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {getTotalCount()}
                  </span>
                </button>

                {categories.map((category) => {
                  const Icon = category.icon;
                  const isActive = activeCategory === category.id;
                  const count = categoryCounts[category.id] || 0;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 whitespace-nowrap ${
                        isActive
                          ? `bg-gradient-to-r ${category.color} text-white shadow-lg`
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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

            {/* Articles Tab */}
            {activeTab === 'articles' && (
              <div className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6566F1]"></div>
                  </div>
                ) : filteredArticles.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No articles found</h3>
                    <p className="text-gray-600">
                      {activeCategory ? 'No articles available in this category.' : 'No articles available yet.'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredArticles.map((article) => {
                      const categoryInfo = categories.find(c => c.id === article.category);
                      return (
                        <div
                          key={article.id}
                          onClick={() => handleArticleClick(article.id)}
                          className="group border border-gray-200 rounded-xl p-5 hover:border-[#6566F1] hover:shadow-md transition-all duration-200 bg-white cursor-pointer"
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
                              <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-[#6566F1] transition-colors">{article.title}</h3>
                              {article.description && (
                                <p className="text-sm text-gray-500 mb-2">{article.description}</p>
                              )}
                              <p className="text-gray-600 text-sm line-clamp-2">{article.content}</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#6566F1] group-hover:translate-x-1 transition-all duration-200 ml-3 flex-shrink-0" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Videos Tab */}
            {activeTab === 'videos' && (
              <div className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6566F1]"></div>
                  </div>
                ) : filteredVideos.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Video className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No videos found</h3>
                    <p className="text-gray-600">
                      {activeCategory ? 'No videos available in this category.' : 'No video tutorials available yet.'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredVideos.map((video) => {
                      const categoryInfo = categories.find(c => c.id === video.category);
                      return (
                        <div key={video.id} className="group border border-gray-200 rounded-xl overflow-hidden hover:border-green-500 hover:shadow-md transition-all duration-200 bg-white">
                          <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center relative">
                            <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                              <Play className="w-8 h-8 text-white ml-1" />
                            </div>
                          </div>
                          <div className="p-4">
                            {categoryInfo && (
                              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r ${categoryInfo.color} text-white mb-2`}>
                                {categoryInfo.label}
                              </span>
                            )}
                            <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-green-600 transition-colors">{video.title}</h3>
                            {video.description && (
                              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{video.description}</p>
                            )}
                            <a
                              href={video.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-sm text-green-600 hover:text-green-700 font-medium"
                            >
                              Watch Video
                              <ExternalLink className="w-4 h-4 ml-1" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* FAQs Tab */}
            {activeTab === 'faqs' && (
              <div className="space-y-3">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6566F1]"></div>
                  </div>
                ) : filteredFaqs.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <HelpCircle className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No FAQs found</h3>
                    <p className="text-gray-600">
                      {activeCategory ? 'No FAQs available in this category.' : 'No FAQs available yet.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredFaqs.map((faq) => {
                      const categoryInfo = categories.find(c => c.id === faq.category);
                      return (
                        <div
                          key={faq.id}
                          onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                          className="group border border-gray-200 rounded-xl p-5 hover:border-purple-500 hover:shadow-md transition-all duration-200 bg-white cursor-pointer"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              {categoryInfo && (
                                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r ${categoryInfo.color} text-white mb-2`}>
                                  {categoryInfo.label}
                                </span>
                              )}
                              <div className="flex items-center space-x-2">
                                <span className="text-purple-600 font-bold">Q:</span>
                                <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">{faq.question}</h3>
                              </div>
                            </div>
                            <span className="text-gray-400 text-xl ml-3">{expandedFaq === faq.id ? '−' : '+'}</span>
                          </div>
                          {expandedFaq === faq.id && (
                            <div className="flex items-start space-x-2 mt-4 pt-4 border-t border-gray-100">
                              <span className="text-green-600 font-bold">A:</span>
                              <p className="text-gray-600">{faq.answer}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-[#6566F1] to-[#5A5BD9] rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Still need help?</h2>
          <p className="text-white/80 mb-6 max-w-2xl mx-auto">
            Can&apos;t find what you&apos;re looking for? Our support team is here to help you.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center px-6 py-3 bg-white text-[#6566F1] rounded-xl font-semibold hover:bg-gray-100 transition-colors"
            >
              Contact Support
              <ChevronRight className="w-5 h-5 ml-1" />
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur text-white rounded-xl font-semibold hover:bg-white/30 transition-colors"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default PublicHelpPage;
