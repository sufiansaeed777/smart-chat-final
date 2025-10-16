'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import RoleGuard from '@/components/auth/RoleGuard';

const HelpPage = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('tutorials');
  const [searchQuery, setSearchQuery] = useState('');

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
          </div>
        )}

        {/* Articles Tab Content */}
        {activeTab === 'articles' && (
          <Card className="border border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-lg">Help Articles</CardTitle>
              <CardDescription>
                Comprehensive guides and documentation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Articles Coming Soon</h3>
                <p className="text-gray-600">Detailed help articles will be available here</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* FAQ Tab Content */}
        {activeTab === 'faq' && (
          <Card className="border border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-lg">Frequently Asked Questions</CardTitle>
              <CardDescription>
                Quick answers to common questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <HelpCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">FAQ Coming Soon</h3>
                <p className="text-gray-600">Common questions and answers will be listed here</p>
              </div>
            </CardContent>
          </Card>
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
                    onClick={() => handleNavigation('/manager-dashboard/settings')}
                  >
                    Send Email
                  </Button>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-medium mb-2">Live Chat</h3>
                  <p className="text-sm text-gray-600 mb-3">Chat with our support team in real-time</p>
                  <Button
                    variant="outline"
                    className="border-gray-300 hover:bg-gray-50 text-gray-700"
                    onClick={() => handleNavigation('/manager-dashboard/issues')}
                  >
                    Report Issue
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
    </RoleGuard>
  );
};

export default HelpPage;
