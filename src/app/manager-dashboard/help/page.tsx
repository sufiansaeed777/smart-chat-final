'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useReportIssue } from '@/contexts/ReportIssueContext';
import {
  HelpCircle,
  Search,
  BookOpen,
  FileText,
  MessageCircle,
  Play,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import RoleGuard from '@/components/auth/RoleGuard';

const HelpPage = () => {
  const router = useRouter();
  const { openModal } = useReportIssue();
  const [activeTab, setActiveTab] = useState('tutorials');
  const [searchQuery, setSearchQuery] = useState('');
  const [articles, setArticles] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({name: '', email: '', subject: '', message: ''});
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

  const tabs = [
    { id: 'articles', label: 'Articles', icon: BookOpen },
    { id: 'tutorials', label: 'Tutorials', icon: FileText },
    { id: 'faq', label: 'FAQ', icon: HelpCircle },
    { id: 'contact', label: 'Contact', icon: MessageCircle }
  ];

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingEmail(true);

    try {
      const response = await fetch('/api/support/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactForm),
      });

      if (response.ok) {
        alert('✅ Message sent successfully!\n\nWe\'ll get back to you within 24 hours.');
        setContactForm({name: '', email: '', subject: '', message: ''});
        setShowContactForm(false);
      } else {
        const error = await response.json();
        alert(`Failed to send message: ${error.error || 'Please try again.'}`);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('An error occurred while sending your message. Please try again or email us directly at support@smartchat.com');
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <RoleGuard allowedRoles={['manager']}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Help Center</h1>
          <p className="text-gray-600 mt-1">
            Find answers, tutorials, and guides to help you get the most out of ChatBot Pro
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search for help articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-gray-300 focus:border-purple-600 focus:ring-purple-600 h-12 text-lg"
          />
        </div>

        {/* Tabs Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-purple-600 text-purple-600 bg-purple-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tutorials Tab Content */}
        {activeTab === 'tutorials' && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Loading videos...</p>
              </div>
            ) : videos.length === 0 ? (
              <Card className="border border-gray-200 bg-white">
                <CardContent className="p-12">
                  <div className="text-center">
                    <Play className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Videos Yet</h3>
                    <p className="text-gray-600">Tutorial videos will appear here once added</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              videos.map((video) => (
                <Card key={video.id} className="border border-gray-200 bg-white hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{video.title}</CardTitle>
                        {video.description && (
                          <CardDescription className="mt-2">{video.description}</CardDescription>
                        )}
                      </div>
                      {video.category && (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          {video.category}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {video.videoUrl && (
                      <div className="aspect-video mb-4">
                        <iframe
                          src={video.videoUrl}
                          className="w-full h-full rounded-lg"
                          allowFullScreen
                          title={video.title}
                        />
                      </div>
                    )}
                    {video.description && (
                      <p className="text-sm text-gray-700">{video.description}</p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Articles Tab Content */}
        {activeTab === 'articles' && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Loading articles...</p>
              </div>
            ) : articles.length === 0 ? (
              <Card className="border border-gray-200 bg-white">
                <CardContent className="p-12">
                  <div className="text-center">
                    <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Articles Yet</h3>
                    <p className="text-gray-600">Help articles will appear here once added</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              articles.map((article) => (
                <Card key={article.id} className="border border-gray-200 bg-white hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{article.title}</CardTitle>
                        {article.description && (
                          <CardDescription className="mt-2">{article.description}</CardDescription>
                        )}
                      </div>
                      {article.category && (
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                          {article.category}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none text-sm text-gray-700">
                      {article.content}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* FAQ Tab Content */}
        {activeTab === 'faq' && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Loading FAQs...</p>
              </div>
            ) : faqs.length === 0 ? (
              <Card className="border border-gray-200 bg-white">
                <CardContent className="p-12">
                  <div className="text-center">
                    <HelpCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No FAQs Yet</h3>
                    <p className="text-gray-600">Frequently asked questions will appear here once added</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              faqs.map((faq) => (
                <Card key={faq.id} className="border border-gray-200 bg-white hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{faq.question}</CardTitle>
                      {faq.category && (
                        <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                          {faq.category}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Contact Tab Content */}
        {activeTab === 'contact' && (
          <Card className="border border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-lg">Contact Support</CardTitle>
              <CardDescription>
                Get help from our support team
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-medium mb-2">Email Support</h3>
                  <p className="text-sm text-gray-600 mb-3">Send us an email and we&apos;ll get back to you within 24 hours</p>
                  <Button
                    variant="outline"
                    className="border-gray-300 hover:bg-gray-50 text-gray-700"
                    onClick={() => setShowContactForm(true)}
                  >
                    Send Email
                  </Button>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-medium mb-2">Report Issues</h3>
                  <p className="text-sm text-gray-600 mb-3">Report bugs, request features, or get help with your account</p>
                  <Button
                    variant="outline"
                    className="border-gray-300 hover:bg-gray-50 text-gray-700"
                    onClick={openModal}
                  >
                    Report an Issue
                  </Button>
                </div>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-medium mb-2">Response Time</h3>
                <p className="text-sm text-gray-600">We typically respond within 2-4 hours during business hours</p>
              </div>
            </CardContent>
          </Card>
        )}

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
                      onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                      placeholder="Your name"
                      required
                      className="w-full"
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
                      onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                      placeholder="your@email.com"
                      required
                      className="w-full"
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
                    onChange={(e) => setContactForm({...contactForm, subject: e.target.value})}
                    placeholder="How can we help you?"
                    required
                    className="w-full"
                  />
                </div>

                <div>
                  <Label htmlFor="contact-message" className="text-sm font-medium text-gray-700 mb-2 block">
                    Message <span className="text-red-500">*</span>
                  </Label>
                  <textarea
                    id="contact-message"
                    value={contactForm.message}
                    onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                    placeholder="Please describe your issue or question in detail..."
                    required
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-[#6566F1] focus:ring-2 focus:ring-[#6566F1]/20 text-gray-900 resize-none"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Response Time:</strong> We typically respond within 2-4 hours during business hours (Mon-Fri, 9am-5pm EST).
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowContactForm(false)}
                    disabled={isSendingEmail}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-[#6566F1] hover:bg-[#5A5BD9] text-white disabled:opacity-50"
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
