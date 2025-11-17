'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useReportIssue } from '@/contexts/ReportIssueContext';
import {
  HelpCircle,
  Search,
  BookOpen,
  FileText,
  MessageCircle,
  Rocket,
  Target,
  Wrench,
  BarChart3,
  Handshake,
  Palette,
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
  const [showAddModal, setShowAddModal] = useState(false);
  const [articles, setArticles] = useState<Array<{id: number; title: string; content: string; category: string}>>([]);
  const [faqs, setFaqs] = useState<Array<{id: number; question: string; answer: string}>>([]);
  const [newArticle, setNewArticle] = useState({title: '', content: '', category: ''});
  const [newVideo, setNewVideo] = useState({title: '', url: '', description: '', difficulty: 'Beginner'});
  const [newFaq, setNewFaq] = useState({question: '', answer: ''});

  const tabs = [
    { id: 'articles', label: 'Articles', icon: BookOpen },
    { id: 'tutorials', label: 'Tutorials', icon: FileText },
    { id: 'faq', label: 'FAQ', icon: HelpCircle },
    { id: 'contact', label: 'Contact', icon: MessageCircle }
  ];

  const tutorials = [
    {
      id: 1,
      title: "Quick Start Guide",
      description: "Get your first bot up and running in 5 minutes",
      difficulty: "Beginner",
      duration: "5:30",
      icon: Rocket,
      color: "text-red-600"
    },
    {
      id: 2,
      title: "Advanced Bot Training",
      description: "Optimize your bot's responses and accuracy",
      difficulty: "Intermediate",
      duration: "12:45",
      icon: Target,
      color: "text-blue-600"
    },
    {
      id: 3,
      title: "Custom Integrations",
      description: "Connect your bot with external services",
      difficulty: "Advanced",
      duration: "18:20",
      icon: Wrench,
      color: "text-gray-600"
    },
    {
      id: 4,
      title: "Analytics Deep Dive",
      description: "Understanding and using conversation analytics",
      difficulty: "Intermediate",
      duration: "9:15",
      icon: BarChart3,
      color: "text-green-600"
    },
    {
      id: 5,
      title: "Handover Best Practices",
      description: "Setting up seamless bot-to-human handovers",
      difficulty: "Intermediate",
      duration: "7:30",
      icon: Handshake,
      color: "text-purple-600"
    },
    {
      id: 6,
      title: "Widget Customization",
      description: "Make your bot match your brand perfectly",
      difficulty: "Beginner",
      duration: "6:45",
      icon: Palette,
      color: "text-orange-600"
    }
  ];

  const [customTutorials, setCustomTutorials] = useState<Array<{id: number; title: string; url: string; description: string; difficulty: string}>>([]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner": return "bg-green-100 text-green-800 border-green-200";
      case "Intermediate": return "bg-blue-100 text-blue-800 border-blue-200";
      case "Advanced": return "bg-purple-100 text-purple-800 border-purple-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const handleAddArticle = () => {
    if (newArticle.title && newArticle.content) {
      setArticles([...articles, { id: Date.now(), ...newArticle }]);
      setNewArticle({title: '', content: '', category: ''});
      setShowAddModal(false);
    }
  };

  const handleAddVideo = () => {
    if (newVideo.title && newVideo.url) {
      setCustomTutorials([...customTutorials, { id: Date.now(), ...newVideo }]);
      setNewVideo({title: '', url: '', description: '', difficulty: 'Beginner'});
      setShowAddModal(false);
    }
  };

  const handleAddFaq = () => {
    if (newFaq.question && newFaq.answer) {
      setFaqs([...faqs, { id: Date.now(), ...newFaq }]);
      setNewFaq({question: '', answer: ''});
      setShowAddModal(false);
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
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Video Tutorials</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tutorials.map((tutorial) => {
                const Icon = tutorial.icon;
                return (
                  <Card key={tutorial.id} className="border border-gray-200 bg-white hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="text-center space-y-4">
                        <div className={`w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto`}>
                          <Icon className={`w-8 h-8 ${tutorial.color}`} />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {tutorial.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-4">
                            {tutorial.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <Badge className={getDifficultyColor(tutorial.difficulty)}>
                              {tutorial.difficulty}
                            </Badge>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <Play className="w-4 h-4" />
                              <span>{tutorial.duration}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {customTutorials.map((tutorial) => (
                <Card key={tutorial.id} className="border border-gray-200 bg-white hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">{tutorial.title}</h3>
                        <Badge className={getDifficultyColor(tutorial.difficulty)}>{tutorial.difficulty}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">{tutorial.description}</p>
                      <a href={tutorial.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm text-[#6566F1] hover:text-[#5A5BD9]">
                        <Play className="w-4 h-4 mr-1" />
                        Watch Video
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Articles Tab Content */}
        {activeTab === 'articles' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Help Articles</h2>
            {articles.length === 0 ? (
              <Card className="border border-gray-200 bg-white">
                <CardContent className="py-12">
                  <div className="text-center">
                    <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Articles Available</h3>
                    <p className="text-gray-600">Check back later for helpful articles and guides</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {articles.map((article) => (
                  <Card key={article.id} className="border border-gray-200 bg-white hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">{article.title}</h3>
                        {article.category && (
                          <Badge className="bg-gray-100 text-gray-800">{article.category}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{article.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* FAQ Tab Content */}
        {activeTab === 'faq' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Frequently Asked Questions</h2>
            {faqs.length === 0 ? (
              <Card className="border border-gray-200 bg-white">
                <CardContent className="py-12">
                  <div className="text-center">
                    <HelpCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No FAQs Available</h3>
                    <p className="text-gray-600">Check back later for frequently asked questions</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {faqs.map((faq) => (
                  <Card key={faq.id} className="border border-gray-200 bg-white">
                    <CardContent className="p-6">
                      <h3 className="text-base font-semibold text-gray-900 mb-2 flex items-start">
                        <HelpCircle className="w-5 h-5 mr-2 text-[#6566F1] flex-shrink-0 mt-0.5" />
                        {faq.question}
                      </h3>
                      <p className="text-sm text-gray-600 ml-7">{faq.answer}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
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

        {/* Add Resource Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {activeTab === 'articles' && 'Add New Article'}
                  {activeTab === 'tutorials' && 'Add Video Link'}
                  {activeTab === 'faq' && 'Add FAQ'}
                </h2>
                <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Article Form */}
              {activeTab === 'articles' && (
                <form onSubmit={(e) => { e.preventDefault(); handleAddArticle(); }} className="space-y-4">
                  <div>
                    <Label htmlFor="article-title" className="text-sm font-medium text-gray-700 mb-2 block">Title</Label>
                    <Input
                      id="article-title"
                      value={newArticle.title}
                      onChange={(e) => setNewArticle({...newArticle, title: e.target.value})}
                      placeholder="Enter article title"
                      required
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label htmlFor="article-category" className="text-sm font-medium text-gray-700 mb-2 block">Category (Optional)</Label>
                    <Input
                      id="article-category"
                      value={newArticle.category}
                      onChange={(e) => setNewArticle({...newArticle, category: e.target.value})}
                      placeholder="e.g., Getting Started, Advanced"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label htmlFor="article-content" className="text-sm font-medium text-gray-700 mb-2 block">Content</Label>
                    <textarea
                      id="article-content"
                      value={newArticle.content}
                      onChange={(e) => setNewArticle({...newArticle, content: e.target.value})}
                      placeholder="Enter article content..."
                      required
                      rows={10}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-[#6566F1] focus:ring-2 focus:ring-[#6566F1]/20 text-gray-900 resize-none"
                    />
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
                    <Button type="submit" className="bg-[#6566F1] hover:bg-[#5A5BD9] text-white">Add Article</Button>
                  </div>
                </form>
              )}

              {/* Video Link Form */}
              {activeTab === 'tutorials' && (
                <form onSubmit={(e) => { e.preventDefault(); handleAddVideo(); }} className="space-y-4">
                  <div>
                    <Label htmlFor="video-title" className="text-sm font-medium text-gray-700 mb-2 block">Video Title</Label>
                    <Input
                      id="video-title"
                      value={newVideo.title}
                      onChange={(e) => setNewVideo({...newVideo, title: e.target.value})}
                      placeholder="Enter video title"
                      required
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label htmlFor="video-url" className="text-sm font-medium text-gray-700 mb-2 block">Video URL</Label>
                    <Input
                      id="video-url"
                      type="url"
                      value={newVideo.url}
                      onChange={(e) => setNewVideo({...newVideo, url: e.target.value})}
                      placeholder="https://youtube.com/... or https://vimeo.com/..."
                      required
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label htmlFor="video-description" className="text-sm font-medium text-gray-700 mb-2 block">Description</Label>
                    <textarea
                      id="video-description"
                      value={newVideo.description}
                      onChange={(e) => setNewVideo({...newVideo, description: e.target.value})}
                      placeholder="Brief description of the video content..."
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-[#6566F1] focus:ring-2 focus:ring-[#6566F1]/20 text-gray-900 resize-none"
                    />
                  </div>
                  <div>
                    <Label htmlFor="video-difficulty" className="text-sm font-medium text-gray-700 mb-2 block">Difficulty Level</Label>
                    <select
                      id="video-difficulty"
                      value={newVideo.difficulty}
                      onChange={(e) => setNewVideo({...newVideo, difficulty: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-[#6566F1] text-gray-900"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
                    <Button type="submit" className="bg-[#6566F1] hover:bg-[#5A5BD9] text-white">Add Video</Button>
                  </div>
                </form>
              )}

              {/* FAQ Form */}
              {activeTab === 'faq' && (
                <form onSubmit={(e) => { e.preventDefault(); handleAddFaq(); }} className="space-y-4">
                  <div>
                    <Label htmlFor="faq-question" className="text-sm font-medium text-gray-700 mb-2 block">Question</Label>
                    <Input
                      id="faq-question"
                      value={newFaq.question}
                      onChange={(e) => setNewFaq({...newFaq, question: e.target.value})}
                      placeholder="Enter the question..."
                      required
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label htmlFor="faq-answer" className="text-sm font-medium text-gray-700 mb-2 block">Answer</Label>
                    <textarea
                      id="faq-answer"
                      value={newFaq.answer}
                      onChange={(e) => setNewFaq({...newFaq, answer: e.target.value})}
                      placeholder="Enter the answer..."
                      required
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-[#6566F1] focus:ring-2 focus:ring-[#6566F1]/20 text-gray-900 resize-none"
                    />
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
                    <Button type="submit" className="bg-[#6566F1] hover:bg-[#5A5BD9] text-white">Add FAQ</Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
};

export default HelpPage;
