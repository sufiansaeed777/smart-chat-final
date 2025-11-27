'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  HelpCircle,
  Search,
  BookOpen,
  FileText,
  MessageCircle,
  Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useChatBot } from '@/contexts/ChatBotContext';

// Convert YouTube URL to embed format
const getYouTubeEmbedUrl = (url: string): string => {
  if (!url) return '';

  // Already an embed URL
  if (url.includes('youtube.com/embed/')) {
    return url;
  }

  // Extract video ID from various YouTube URL formats
  let videoId = '';

  // Format: youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/[?&]v=([^&]+)/);
  if (watchMatch) {
    videoId = watchMatch[1];
  }

  // Format: youtu.be/VIDEO_ID
  const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch) {
    videoId = shortMatch[1];
  }

  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}`;
  }

  // Return original URL if not a YouTube URL
  return url;
};

const HelpPage = () => {
  const router = useRouter();
  const { triggerChat } = useChatBot();
  const [activeTab, setActiveTab] = useState('tutorials');
  const [searchQuery, setSearchQuery] = useState('');
  const [articles, setArticles] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    
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
                    {video.url && (
                      <div className="aspect-video mb-4">
                        <iframe
                          src={getYouTubeEmbedUrl(video.url)}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
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
                    asChild
                  >
                    <a href="mailto:support@chatbotpro.com">Send Email</a>
                  </Button>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-medium mb-2">Live Chat</h3>
                  <p className="text-sm text-gray-600 mb-3">Chat with our support team in real-time</p>
                  <Button 
                    variant="outline" 
                    className="border-gray-300 hover:bg-gray-50 text-gray-700"
                    onClick={triggerChat}
                  >
                    Start Chat
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
      </div>
    
  );
};

export default HelpPage;
