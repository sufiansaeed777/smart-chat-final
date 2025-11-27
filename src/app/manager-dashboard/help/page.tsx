'use client';

import React, { useState, useEffect } from 'react';
import { useReportIssue } from '@/contexts/ReportIssueContext';
import { useChatBot } from '@/contexts/ChatBotContext';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import RoleGuard from '@/components/auth/RoleGuard';

// Category definitions
const categories = [
  { id: 'gs', title: 'Getting Started', desc: 'Learn basics & first steps' },
  { id: 'um', title: 'User Management', desc: 'Roles, permissions, members' },
  { id: 'bc', title: 'Bot Creation', desc: 'Creating & training your bot' },
  { id: 'an', title: 'Analytics', desc: 'Track usage & performance' },
  { id: 'ts', title: 'Troubleshooting', desc: 'Fix errors & common issues' },
];

// Convert YouTube URL to embed format
const getYouTubeEmbedUrl = (url: string): string => {
  if (!url) return '';
  if (url.includes('youtube.com/embed/')) return url;

  let videoId = '';
  const watchMatch = url.match(/[?&]v=([^&]+)/);
  if (watchMatch) videoId = watchMatch[1];
  const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch) videoId = shortMatch[1];

  if (videoId) return `https://www.youtube.com/embed/${videoId}`;
  return url;
};

const HelpPage = () => {
  const { openModal } = useReportIssue();
  const { triggerChat } = useChatBot();
  const [activeTab, setActiveTab] = useState<'articles' | 'videos' | 'faqs' | 'contact'>('articles');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [articles, setArticles] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Fetch help content from API
  useEffect(() => {
    const fetchHelpContent = async () => {
      try {
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
        alert('Message sent successfully! We\'ll get back to you within 24 hours.');
        setContactForm({ name: '', email: '', subject: '', message: '' });
        setShowContactForm(false);
      } else {
        const error = await response.json();
        alert(`Failed to send message: ${error.error || 'Please try again.'}`);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Filter content by category
  const getFilteredContent = (items: any[], categoryId: string | null) => {
    if (!categoryId) return items;
    // Map category ID to category name for filtering
    const categoryMap: { [key: string]: string } = {
      gs: 'Getting Started',
      um: 'User Management',
      bc: 'Bot Creation',
      an: 'Analytics',
      ts: 'Troubleshooting'
    };
    const categoryName = categoryMap[categoryId];
    return items.filter(item =>
      item.category?.toLowerCase() === categoryName?.toLowerCase()
    );
  };

  const filteredArticles = getFilteredContent(articles, selectedCategory);
  const filteredVideos = getFilteredContent(videos, selectedCategory);
  const filteredFaqs = getFilteredContent(faqs, selectedCategory);

  const tabs = [
    { id: 'articles' as const, label: 'Articles', icon: '📄' },
    { id: 'videos' as const, label: 'Videos', icon: '🎬' },
    { id: 'faqs' as const, label: 'FAQs', icon: '❓' },
    { id: 'contact' as const, label: 'Contact', icon: '💬' },
  ];

  return (
    <RoleGuard allowedRoles={['manager']}>
      <div style={{ fontFamily: 'Inter, sans-serif', background: '#f5f7fb', minHeight: '100vh' }}>
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 md:px-10 py-5">
          <span className="text-xl font-bold text-gray-900">Help</span>
        </header>

        <div className="px-6 md:px-10 py-8">
          {/* Title & Subtitle */}
          <h1 className="text-[28px] font-bold text-gray-900 mb-1">Help Center</h1>
          <p className="text-[#6b7280] mb-6">
            Find answers, tutorials, and guides to help you get the most out of Smart Chat
          </p>

          {/* Search Box */}
          <div className="relative mb-5">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-3.5 pl-12 pr-4 text-[15px] border border-[#d1d5db] rounded-[10px] focus:outline-none focus:border-[#7b2af5] focus:ring-2 focus:ring-[#7b2af5]/20"
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-6 border-b border-gray-200 pb-2.5 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 'contact') setSelectedCategory(null);
                }}
                className={`flex items-center gap-2 py-2.5 px-1.5 font-medium text-sm cursor-pointer transition-colors ${
                  activeTab === tab.id
                    ? 'text-[#7b2af5] border-b-2 border-[#7b2af5]'
                    : 'text-[#6b7280] hover:text-gray-900'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Categories Grid (not shown for Contact tab) */}
          {activeTab !== 'contact' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                  className={`bg-white p-5 rounded-[14px] border cursor-pointer transition-all duration-200 ${
                    selectedCategory === cat.id
                      ? 'border-[#7b2af5] bg-[#faf7ff]'
                      : 'border-[#e5e7eb] hover:border-[#7b2af5] hover:bg-[#faf7ff]'
                  }`}
                >
                  <div className="text-[17px] font-semibold text-gray-900">{cat.title}</div>
                  <div className="text-[#6b7280] text-sm mt-1.5">{cat.desc}</div>
                </div>
              ))}
            </div>
          )}

          {/* Content Area */}
          <div className="mt-6">
            {/* Articles */}
            {activeTab === 'articles' && (
              <div className="space-y-4">
                {loading ? (
                  <p className="text-center text-gray-500 py-8">Loading articles...</p>
                ) : filteredArticles.length === 0 ? (
                  <div className="bg-white border border-[#e5e7eb] rounded-xl p-8 text-center">
                    <div className="text-4xl mb-3">📄</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">No Articles Yet</h3>
                    <p className="text-[#6b7280] text-sm">
                      {selectedCategory ? 'No articles in this category.' : 'Help articles will appear here once added.'}
                    </p>
                  </div>
                ) : (
                  filteredArticles.map((article) => (
                    <div
                      key={article.id}
                      className="bg-white border border-[#e5e7eb] rounded-xl p-5 hover:shadow-md transition-shadow"
                    >
                      <div className="font-semibold text-gray-900 mb-1.5">{article.title}</div>
                      <div className="text-[#6b7280] text-sm">{article.content || article.description}</div>
                      {article.category && (
                        <span className="inline-block mt-3 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                          {article.category}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Videos */}
            {activeTab === 'videos' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {loading ? (
                  <p className="col-span-2 text-center text-gray-500 py-8">Loading videos...</p>
                ) : filteredVideos.length === 0 ? (
                  <div className="col-span-2 bg-white border border-[#e5e7eb] rounded-xl p-8 text-center">
                    <div className="text-4xl mb-3">🎬</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">No Videos Yet</h3>
                    <p className="text-[#6b7280] text-sm">
                      {selectedCategory ? 'No videos in this category.' : 'Tutorial videos will appear here once added.'}
                    </p>
                  </div>
                ) : (
                  filteredVideos.map((video) => (
                    <div
                      key={video.id}
                      className="bg-white border border-[#e5e7eb] rounded-[10px] p-3 hover:shadow-md transition-shadow"
                    >
                      {video.url && (
                        <div className="aspect-video mb-3 rounded-lg overflow-hidden">
                          <iframe
                            src={getYouTubeEmbedUrl(video.url)}
                            className="w-full h-full"
                            allowFullScreen
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            title={video.title}
                          />
                        </div>
                      )}
                      <div className="font-semibold text-gray-900">{video.title}</div>
                      {video.description && (
                        <div className="text-[#6b7280] text-[13px] mt-1.5">{video.description}</div>
                      )}
                      {video.category && (
                        <span className="inline-block mt-2 px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">
                          {video.category}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* FAQs */}
            {activeTab === 'faqs' && (
              <div className="space-y-3">
                {loading ? (
                  <p className="text-center text-gray-500 py-8">Loading FAQs...</p>
                ) : filteredFaqs.length === 0 ? (
                  <div className="bg-white border border-[#e5e7eb] rounded-xl p-8 text-center">
                    <div className="text-4xl mb-3">❓</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">No FAQs Yet</h3>
                    <p className="text-[#6b7280] text-sm">
                      {selectedCategory ? 'No FAQs in this category.' : 'FAQs will appear here once added.'}
                    </p>
                  </div>
                ) : (
                  filteredFaqs.map((faq) => (
                    <div
                      key={faq.id}
                      onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                      className="bg-white border border-[#e5e7eb] rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <div className="font-semibold text-gray-900 flex items-center justify-between">
                        {faq.question}
                        <span className="text-[#6b7280]">{expandedFaq === faq.id ? '−' : '+'}</span>
                      </div>
                      {expandedFaq === faq.id && (
                        <div className="text-[#6b7280] text-sm mt-2 pt-2 border-t border-gray-100">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Contact */}
            {activeTab === 'contact' && (
              <div className="bg-white border border-[#e5e7eb] rounded-xl p-5">
                <h2 className="text-xl font-semibold text-gray-900 mb-5">Contact Support</h2>

                {/* Email Support */}
                <div className="bg-white border border-[#e5e7eb] rounded-xl p-4 mb-4">
                  <h3 className="text-base font-semibold text-gray-900 mb-1">Email Support</h3>
                  <span className="inline-block text-[#10b981] font-semibold text-sm mb-1">Available</span>
                  <p className="text-[#6b7280] text-sm mb-3">Get help via email within 24 hours</p>
                  <button
                    onClick={() => setShowContactForm(true)}
                    className="px-4 py-2.5 bg-[#7b2af5] text-white rounded-lg font-medium text-sm hover:bg-[#6a24d6] transition-colors"
                  >
                    Send Email
                  </button>
                </div>

                {/* Live Chat */}
                <div className="bg-white border border-[#e5e7eb] rounded-xl p-4 mb-4">
                  <h3 className="text-base font-semibold text-gray-900 mb-1">Live Chat</h3>
                  <span className="inline-block text-[#10b981] font-semibold text-sm mb-1">Available</span>
                  <p className="text-[#6b7280] text-sm mb-3">Chat with our support team in real-time</p>
                  <button
                    onClick={triggerChat}
                    className="px-4 py-2.5 bg-[#7b2af5] text-white rounded-lg font-medium text-sm hover:bg-[#6a24d6] transition-colors"
                  >
                    Start Chat
                  </button>
                </div>

                {/* Report Issues */}
                <div className="bg-white border border-[#e5e7eb] rounded-xl p-4">
                  <h3 className="text-base font-semibold text-gray-900 mb-1">Report Issues</h3>
                  <p className="text-[#6b7280] text-sm mb-3">Report bugs, request features, or get help with your account</p>
                  <button
                    onClick={openModal}
                    className="px-4 py-2.5 bg-[#7b2af5] text-white rounded-lg font-medium text-sm hover:bg-[#6a24d6] transition-colors"
                  >
                    Report an Issue
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contact Form Modal */}
        {showContactForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Contact Support</h2>
                <button onClick={() => setShowContactForm(false)} className="text-gray-500 hover:text-gray-700">
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-[#7b2af5] focus:ring-2 focus:ring-[#7b2af5]/20 text-gray-900 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowContactForm(false)} disabled={isSendingEmail}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-[#7b2af5] hover:bg-[#6a24d6] text-white"
                    disabled={isSendingEmail}
                  >
                    {isSendingEmail ? 'Sending...' : 'Send Message'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
};

export default HelpPage;
