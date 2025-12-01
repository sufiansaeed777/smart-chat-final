'use client';

import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Search,
  BookOpen,
  MessageCircle,
  Mail,
  Phone,
  Video,
  FileText,
  ExternalLink,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Info,
  Plus,
  XCircle,
  Trash2,
  Users,
  BarChart3,
  Wrench,
  Play
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

const HelpPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('getting-started');
  const [activeTab, setActiveTab] = useState<'articles' | 'videos' | 'faqs'>('articles');
  const [articles, setArticles] = useState<Article[]>([]);
  const [videos, setVideos] = useState<VideoLinkType[]>([]);
  const [faqs, setFaqs] = useState<FAQType[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showFaqModal, setShowFaqModal] = useState(false);

  // Form states
  const [articleForm, setArticleForm] = useState({ title: '', content: '', description: '' });
  const [videoForm, setVideoForm] = useState({ title: '', url: '', description: '', thumbnail: '', duration: '' });
  const [faqForm, setFaqForm] = useState({ question: '', answer: '' });

  const categories = [
    { id: 'getting-started', label: 'Getting Started', icon: BookOpen, color: 'from-blue-500 to-blue-600' },
    { id: 'user-management', label: 'User Management', icon: Users, color: 'from-purple-500 to-purple-600' },
    { id: 'bot-creation', label: 'Bot Creation', icon: FileText, color: 'from-green-500 to-green-600' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'from-orange-500 to-orange-600' },
    { id: 'troubleshooting', label: 'Troubleshooting', icon: Wrench, color: 'from-red-500 to-red-600' }
  ];

  const contentTabs = [
    { id: 'articles', label: 'Articles', icon: BookOpen, count: 0 },
    { id: 'videos', label: 'Videos', icon: Video, count: 0 },
    { id: 'faqs', label: 'FAQs', icon: HelpCircle, count: 0 }
  ];

  const loadData = async () => {
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
      console.error('Error loading help data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddArticle = async () => {
    try {
      const response = await fetch('/api/admin/help/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...articleForm,
          category: activeCategory
        })
      });

      if (response.ok) {
        alert('Article added successfully!');
        setArticleForm({ title: '', content: '', description: '' });
        setShowArticleModal(false);
        loadData();
      } else {
        const error = await response.json();
        alert(`Failed to add article: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding article:', error);
      alert('Failed to add article');
    }
  };

  const handleAddVideo = async () => {
    try {
      const response = await fetch('/api/admin/help/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...videoForm,
          duration: parseInt(videoForm.duration) || 0,
          category: activeCategory
        })
      });

      if (response.ok) {
        alert('Video link added successfully!');
        setVideoForm({ title: '', url: '', description: '', thumbnail: '', duration: '' });
        setShowVideoModal(false);
        loadData();
      } else {
        const error = await response.json();
        alert(`Failed to add video: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding video:', error);
      alert('Failed to add video');
    }
  };

  const handleAddFaq = async () => {
    try {
      const response = await fetch('/api/admin/help/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...faqForm,
          category: activeCategory
        })
      });

      if (response.ok) {
        alert('FAQ added successfully!');
        setFaqForm({ question: '', answer: '' });
        setShowFaqModal(false);
        loadData();
      } else {
        const error = await response.json();
        alert(`Failed to add FAQ: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding FAQ:', error);
      alert('Failed to add FAQ');
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return;

    try {
      const response = await fetch('/api/admin/help/articles', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      if (response.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Error deleting article:', error);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return;

    try {
      const response = await fetch('/api/admin/help/videos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      if (response.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Error deleting video:', error);
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;

    try {
      const response = await fetch('/api/admin/help/faqs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      if (response.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Error deleting FAQ:', error);
    }
  };

  const filteredArticles = articles.filter(article =>
    article.category === activeCategory &&
    (article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
     article.content.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredVideos = videos.filter(video =>
    video.category === activeCategory &&
    (video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
     (video.description && video.description.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const filteredFaqs = faqs.filter(faq =>
    faq.category === activeCategory &&
    (faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
     faq.answer.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Update counts for tabs
  const tabsWithCounts = contentTabs.map(tab => ({
    ...tab,
    count: tab.id === 'articles' ? filteredArticles.length :
           tab.id === 'videos' ? filteredVideos.length :
           filteredFaqs.length
  }));

  const supportOptions = [
    {
      title: 'Email Support',
      description: 'Get help via email within 24 hours',
      icon: Mail,
      action: 'Send Email',
      available: true,
      color: 'bg-blue-500'
    },
    {
      title: 'Live Chat',
      description: 'Chat with our support team in real-time',
      icon: MessageCircle,
      action: 'Start Chat',
      available: true,
      color: 'bg-green-500'
    },
    {
      title: 'Video Call',
      description: 'Schedule a video call with our experts',
      icon: Video,
      action: 'Schedule Call',
      available: false,
      color: 'bg-purple-500'
    },
    {
      title: 'Phone Support',
      description: 'Call us for immediate assistance',
      icon: Phone,
      action: 'Call Now',
      available: true,
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Help & Support</h1>
          <p className="text-gray-600 mt-2">Manage help articles, videos, and FAQs</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowArticleModal(true)}
            className="flex items-center space-x-2 bg-[#6566F1] text-white px-4 py-2.5 rounded-xl hover:bg-[#5A5BD9] transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Add Article</span>
          </button>
          <button
            onClick={() => setShowVideoModal(true)}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2.5 rounded-xl hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Add Video</span>
          </button>
          <button
            onClick={() => setShowFaqModal(true)}
            className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2.5 rounded-xl hover:bg-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Add FAQ</span>
          </button>
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

      {/* Horizontal Categories */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center space-x-3 overflow-x-auto pb-1">
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = activeCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center space-x-2 px-5 py-3 rounded-xl font-medium transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? `bg-gradient-to-r ${category.color} text-white shadow-lg`
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{category.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Tab Headers */}
        <div className="flex border-b border-gray-200">
          {tabsWithCounts.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'articles' | 'videos' | 'faqs')}
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
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6">
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
                  <p className="text-gray-600">Add articles to help users in this category.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredArticles.map((article) => (
                    <div key={article.id} className="group border border-gray-200 rounded-xl p-5 hover:border-[#6566F1] hover:shadow-md transition-all duration-200 bg-white">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-[#6566F1] transition-colors">{article.title}</h3>
                          {article.description && (
                            <p className="text-sm text-gray-500 mb-2">{article.description}</p>
                          )}
                          <p className="text-gray-600 text-sm line-clamp-2">{article.content}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteArticle(article.id)}
                          className="ml-4 text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-all duration-200 opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
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
                  <p className="text-gray-600">Add video tutorials for this category.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredVideos.map((video) => (
                    <div key={video.id} className="group border border-gray-200 rounded-xl overflow-hidden hover:border-green-500 hover:shadow-md transition-all duration-200 bg-white">
                      <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center relative">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                          <Play className="w-8 h-8 text-white ml-1" />
                        </div>
                        <button
                          onClick={() => handleDeleteVideo(video.id)}
                          className="absolute top-2 right-2 text-white/60 hover:text-red-400 p-2 rounded-lg hover:bg-black/20 transition-all duration-200 opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="p-4">
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
                  ))}
                </div>
              )}
            </div>
          )}

          {/* FAQs Tab */}
          {activeTab === 'faqs' && (
            <div className="space-y-4">
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
                  <p className="text-gray-600">Add FAQs to help users quickly find answers.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredFaqs.map((faq) => (
                    <div key={faq.id} className="group border border-gray-200 rounded-xl p-5 hover:border-purple-500 hover:shadow-md transition-all duration-200 bg-white">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-purple-600 font-bold">Q:</span>
                            <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">{faq.question}</h3>
                          </div>
                          <div className="flex items-start space-x-2">
                            <span className="text-green-600 font-bold">A:</span>
                            <p className="text-gray-600">{faq.answer}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteFaq(faq.id)}
                          className="ml-4 text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-all duration-200 opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {supportOptions.map((option, index) => {
            const Icon = option.icon;
            const isEmailSupport = option.title === 'Email Support';

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
                    {option.available ? (
                      <span className="text-xs text-green-600 flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Available
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500 flex items-center">
                        <Info className="w-3 h-3 mr-1" />
                        Coming Soon
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">{option.description}</p>
                {isEmailSupport && option.available ? (
                  <a
                    href="mailto:support@chatbotpro.com"
                    className="w-full py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 bg-[#6566F1] text-white hover:bg-[#5A5BD9] flex items-center justify-center"
                  >
                    {option.action}
                  </a>
                ) : (
                  <button
                    disabled={!option.available}
                    className={`w-full py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                      option.available
                        ? 'bg-[#6566F1] text-white hover:bg-[#5A5BD9]'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {option.action}
                  </button>
                )}
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

      {/* Add Article Modal */}
      {showArticleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowArticleModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-[600px] max-w-[90vw] shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#6566F1] to-[#5A5BD9] rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Add Article</h3>
                  <p className="text-sm text-gray-600">Category: {categories.find(c => c.id === activeCategory)?.label}</p>
                </div>
              </div>
              <button
                onClick={() => setShowArticleModal(false)}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Title</label>
                <input
                  type="text"
                  value={articleForm.title}
                  onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#6566F1] focus:border-[#6566F1] text-gray-900 transition-all duration-200"
                  placeholder="Enter article title"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Description (Optional)</label>
                <input
                  type="text"
                  value={articleForm.description}
                  onChange={(e) => setArticleForm({ ...articleForm, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#6566F1] focus:border-[#6566F1] text-gray-900 transition-all duration-200"
                  placeholder="Brief description"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Content</label>
                <textarea
                  value={articleForm.content}
                  onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })}
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#6566F1] focus:border-[#6566F1] text-gray-900 transition-all duration-200"
                  placeholder="Enter article content"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3 mt-6">
              <button
                onClick={handleAddArticle}
                disabled={!articleForm.title || !articleForm.content}
                className="flex-1 bg-gradient-to-r from-[#6566F1] to-[#5A5BD9] text-white py-3 px-6 rounded-xl hover:opacity-90 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                Add Article
              </button>
              <button
                onClick={() => setShowArticleModal(false)}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors font-medium border border-gray-300 rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowVideoModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-[600px] max-w-[90vw] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <Video className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Add Video Link</h3>
                  <p className="text-sm text-gray-600">Category: {categories.find(c => c.id === activeCategory)?.label}</p>
                </div>
              </div>
              <button
                onClick={() => setShowVideoModal(false)}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Title</label>
                <input
                  type="text"
                  value={videoForm.title}
                  onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 transition-all duration-200"
                  placeholder="Enter video title"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Video URL</label>
                <input
                  type="url"
                  value={videoForm.url}
                  onChange={(e) => setVideoForm({ ...videoForm, url: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 transition-all duration-200"
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Description (Optional)</label>
                <textarea
                  value={videoForm.description}
                  onChange={(e) => setVideoForm({ ...videoForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 transition-all duration-200"
                  placeholder="Brief description of the video"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Thumbnail URL (Optional)</label>
                  <input
                    type="url"
                    value={videoForm.thumbnail}
                    onChange={(e) => setVideoForm({ ...videoForm, thumbnail: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 transition-all duration-200"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Duration (seconds)</label>
                  <input
                    type="number"
                    value={videoForm.duration}
                    onChange={(e) => setVideoForm({ ...videoForm, duration: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 transition-all duration-200"
                    placeholder="300"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 mt-6">
              <button
                onClick={handleAddVideo}
                disabled={!videoForm.title || !videoForm.url}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-xl hover:opacity-90 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                Add Video
              </button>
              <button
                onClick={() => setShowVideoModal(false)}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors font-medium border border-gray-300 rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add FAQ Modal */}
      {showFaqModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowFaqModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-[600px] max-w-[90vw] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <HelpCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Add FAQ</h3>
                  <p className="text-sm text-gray-600">Category: {categories.find(c => c.id === activeCategory)?.label}</p>
                </div>
              </div>
              <button
                onClick={() => setShowFaqModal(false)}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Question</label>
                <input
                  type="text"
                  value={faqForm.question}
                  onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 transition-all duration-200"
                  placeholder="Enter the question"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Answer</label>
                <textarea
                  value={faqForm.answer}
                  onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 transition-all duration-200"
                  placeholder="Enter the answer"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3 mt-6">
              <button
                onClick={handleAddFaq}
                disabled={!faqForm.question || !faqForm.answer}
                className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 px-6 rounded-xl hover:opacity-90 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                Add FAQ
              </button>
              <button
                onClick={() => setShowFaqModal(false)}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors font-medium border border-gray-300 rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HelpPage;
