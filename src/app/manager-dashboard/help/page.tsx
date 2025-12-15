'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useReportIssue } from '@/contexts/ReportIssueContext';
import { useChatBot } from '@/contexts/ChatBotContext';
import {
  HelpCircle,
  Search,
  BookOpen,
  MessageCircle,
  Mail,
  Video,
  FileText,
  ExternalLink,
  ChevronRight,
  CheckCircle,
  X,
  Users,
  BarChart3,
  Wrench,
  Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import RoleGuard from '@/components/auth/RoleGuard';

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

const HelpPage = () => {
  const router = useRouter();
  const { openModal } = useReportIssue();
  const { triggerChat } = useChatBot();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'articles' | 'videos' | 'faqs'>('articles');
  const [articles, setArticles] = useState<Article[]>([]);
  const [videos, setVideos] = useState<VideoLinkType[]>([]);
  const [faqs, setFaqs] = useState<FAQType[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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

  // Fetch help content from API
  useEffect(() => {
    const fetchHelpContent = async () => {
      try {
        setLoading(true);
        const [articlesRes, videosRes, faqsRes] = await Promise.all([
          fetch('/api/admin/help/articles'),
          fetch('/api/admin/help/videos'),
          fetch('/api/admin/help/faqs')
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

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingEmail(true);

    try {
      const response = await fetch('/api/support/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      });

      if (response.ok) {
        setContactForm({ name: '', email: '', subject: '', message: '' });
        setShowContactForm(false);
        setShowSuccessModal(true);
      } else {
        const error = await response.json();
        setErrorMessage(error.error || 'Please try again.');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setErrorMessage('An error occurred. Please try again.');
      setShowErrorModal(true);
    } finally {
      setIsSendingEmail(false);
    }
  };

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

  const supportOptions = [
    {
      title: 'Email Support',
      description: 'Get help via email within 24 hours',
      icon: Mail,
      action: 'Send Email',
      available: true,
      color: 'bg-blue-500',
      type: 'email'
    },
    {
      title: 'Live Chat',
      description: 'Chat with our support team in real-time',
      icon: MessageCircle,
      action: 'Start Chat',
      available: true,
      color: 'bg-green-500',
      type: 'chat'
    },
    {
      title: 'Report Issues',
      description: 'Report bugs, request features, or get help',
      icon: HelpCircle,
      action: 'Report an Issue',
      available: true,
      color: 'bg-purple-500',
      type: 'report'
    }
  ];

  // Navigate to article detail page
  const handleArticleClick = (articleId: string) => {
    router.push(`/manager-dashboard/help/article/${articleId}`);
  };

  return (
    <RoleGuard allowedRoles={['manager']}>
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Help & Support</h1>
            <p className="text-gray-600 mt-2">Find answers, tutorials, and guides to help you get the most out of Smart Chat</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for help articles, FAQs, and guides..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6566F1] focus:border-transparent bg-gray-50 text-gray-900 placeholder-gray-500 transition-all duration-200"
            />
          </div>
        </div>

        {/* Content Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Tab Headers */}
          <div className="flex border-b border-gray-200">
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

          {/* Tab Content */}
          <div className="p-6">
            {/* Categories inside each tab */}
            <div className="mb-6">
              <div className="flex items-center space-x-3 overflow-x-auto pb-2">
                {/* All Category Button */}
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

        {/* Support Options */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <MessageCircle className="w-6 h-6 mr-2 text-[#6566F1]" />
            Contact Support
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {supportOptions.map((option, index) => {
              const Icon = option.icon;

              return (
                <div key={index} className="group p-5 border border-gray-200 rounded-xl hover:border-[#6566F1] hover:shadow-md transition-all duration-200 bg-white">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      option.available ? option.color : 'bg-gray-200'
                    } text-white transition-transform duration-200 group-hover:scale-110`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{option.title}</h4>
                      {option.available && (
                        <span className="text-xs text-green-600 flex items-center">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Available
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{option.description}</p>
                  <button
                    onClick={() => {
                      if (option.type === 'email') {
                        setShowContactForm(true);
                      } else if (option.type === 'chat') {
                        triggerChat();
                      } else if (option.type === 'report') {
                        openModal();
                      }
                    }}
                    className="w-full py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 bg-[#6566F1] text-white hover:bg-[#5A5BD9]"
                  >
                    {option.action}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <BookOpen className="w-6 h-6 mr-2 text-[#6566F1]" />
            Quick Links
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: 'API Documentation', description: 'Complete API reference and examples', url: '#' },
              { title: 'Integration Guide', description: 'Step-by-step integration tutorials', url: '#' },
              { title: 'Best Practices', description: 'Tips for optimal bot performance', url: '#' },
              { title: 'Security Guide', description: 'Security best practices and compliance', url: '#' },
              { title: 'Troubleshooting', description: 'Common issues and solutions', url: '#' },
              { title: 'Release Notes', description: 'Latest updates and new features', url: '#' }
            ].map((link, index) => (
              <a
                key={index}
                href={link.url}
                className="group p-4 border border-gray-200 rounded-xl hover:border-[#6566F1] hover:shadow-md transition-all duration-200 bg-white"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900 group-hover:text-[#6566F1] transition-colors">
                      {link.title}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">{link.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#6566F1] group-hover:translate-x-1 transition-all duration-200" />
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Contact Form Modal */}
        {showContactForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Contact Support</h2>
                    <p className="text-sm text-gray-600">We&apos;ll get back to you within 24 hours</p>
                  </div>
                </div>
                <button onClick={() => setShowContactForm(false)} className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSendEmail} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contact-name" className="text-sm font-medium text-gray-700 mb-2 block">
                      Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="contact-name"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      placeholder="Your name"
                      required
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact-email" className="text-sm font-medium text-gray-700 mb-2 block">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="contact-email"
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      placeholder="your@email.com"
                      required
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="contact-subject" className="text-sm font-medium text-gray-700 mb-2 block">
                    Subject <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="contact-subject"
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                    placeholder="How can we help you?"
                    required
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <Label htmlFor="contact-message" className="text-sm font-medium text-gray-700 mb-2 block">
                    Message <span className="text-red-500">*</span>
                  </Label>
                  <textarea
                    id="contact-message"
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    placeholder="Please describe your issue or question..."
                    required
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#6566F1] focus:border-[#6566F1] text-gray-900 resize-none transition-all duration-200"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowContactForm(false)} disabled={isSendingEmail} className="rounded-xl">
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-[#6566F1] to-[#5A5BD9] hover:opacity-90 text-white rounded-xl"
                    disabled={isSendingEmail}
                  >
                    {isSendingEmail ? 'Sending...' : 'Send Message'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
                Message Sent!
              </h2>
              <p className="text-gray-600 text-center mb-6">
                We&apos;ll get back to you within 24 hours.
              </p>
              <Button
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-2.5 rounded-xl bg-[#6566F1] hover:bg-[#5A5BD9] text-white"
              >
                Got it
              </Button>
            </div>
          </div>
        )}

        {/* Error Modal */}
        {showErrorModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
                <X className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
                Failed to Send
              </h2>
              <p className="text-gray-600 text-center mb-6">
                {errorMessage}
              </p>
              <Button
                onClick={() => setShowErrorModal(false)}
                className="w-full py-2.5 rounded-xl bg-[#6566F1] hover:bg-[#5A5BD9] text-white"
              >
                Try Again
              </Button>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
};

export default HelpPage;
