'use client';

import React, { useState } from 'react';
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
  Info
} from 'lucide-react';

const HelpPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('getting-started');

  const categories = [
    { id: 'getting-started', label: 'Getting Started', icon: BookOpen },
    { id: 'user-management', label: 'User Management', icon: MessageCircle },
    { id: 'bot-creation', label: 'Bot Creation', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: HelpCircle },
    { id: 'troubleshooting', label: 'Troubleshooting', icon: AlertCircle }
  ];

  const faqs = [
    {
      category: 'getting-started',
      question: 'How do I create my first bot?',
      answer: 'To create your first bot, navigate to the Bots section and click "Create Bot". Follow the setup wizard to configure your bot\'s personality, knowledge base, and integrations.'
    },
    {
      category: 'user-management',
      question: 'How do I invite new users?',
      answer: 'Go to User Management and click "Add User". Enter their email address and select their role. They will receive an invitation email to join the platform.'
    },
    {
      category: 'bot-creation',
      question: 'What types of bots can I create?',
      answer: 'You can create various types of bots including customer support, sales assistants, FAQ bots, and custom conversational AI bots for specific use cases.'
    },
    {
      category: 'analytics',
      question: 'How do I view bot performance?',
      answer: 'Navigate to the Analytics section to view detailed metrics including conversation volume, user engagement, response times, and satisfaction scores.'
    },
    {
      category: 'troubleshooting',
      question: 'My bot is not responding correctly',
      answer: 'Check the bot\'s knowledge base, review recent conversations, and ensure all integrations are properly configured. Contact support if issues persist.'
    }
  ];

  const filteredFaqs = faqs.filter(faq => 
    faq.category === activeCategory && 
    (faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
     faq.answer.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const supportOptions = [
    {
      title: 'Email Support',
      description: 'Get help via email within 24 hours',
      icon: Mail,
      action: 'Send Email',
      available: true
    },
    {
      title: 'Live Chat',
      description: 'Chat with our support team in real-time',
      icon: MessageCircle,
      action: 'Start Chat',
      available: true
    },
    {
      title: 'Video Call',
      description: 'Schedule a video call with our experts',
      icon: Video,
      action: 'Schedule Call',
      available: false
    },
    {
      title: 'Phone Support',
      description: 'Call us for immediate assistance',
      icon: Phone,
      action: 'Call Now',
      available: true
    }
  ];

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Help & Support</h1>
          <p className="text-gray-600 mt-2">Find answers to your questions and get support</p>
        </div>
        </div>

      {/* Search */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search for help articles, FAQs, and guides..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6566F1] focus:border-transparent bg-gray-50"
          />
        </div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Categories Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border-0 p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
            <nav className="space-y-2">
              {categories.map((category) => {
                const Icon = category.icon;
              return (
                <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-colors ${
                      activeCategory === category.id
                        ? 'bg-[#6566F1] text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {category.label}
                </button>
              );
            })}
          </nav>
        </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-sm border-0 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {categories.find(c => c.id === activeCategory)?.label}
            </h2>
            
            <div className="space-y-4">
              {filteredFaqs.map((faq, index) => (
                <div key={index} className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors">
                  <h3 className="font-semibold text-gray-900 mb-2">{faq.question}</h3>
                  <p className="text-gray-600 text-sm">{faq.answer}</p>
                </div>
              ))}
              
              {filteredFaqs.length === 0 && (
                <div className="text-center py-8">
                  <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
                  <p className="text-gray-600">Try adjusting your search terms or browse different categories.</p>
                      </div>
              )}
                          </div>
                        </div>
                      </div>
                    </div>

      {/* Support Options */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border-0">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <MessageCircle className="w-6 h-6 mr-2 text-[#6566F1]" />
          Contact Support
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {supportOptions.map((option, index) => {
            const Icon = option.icon;
            const isEmailSupport = option.title === 'Email Support';

            return (
              <div key={index} className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    option.available ? 'bg-[#6566F1] text-white' : 'bg-gray-100 text-gray-400'
                  }`}>
                    <Icon className="w-5 h-5" />
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
                <p className="text-sm text-gray-600 mb-3">{option.description}</p>
                {isEmailSupport && option.available ? (
                  <a
                    href="mailto:support@chatbotpro.com"
                    className="w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors bg-[#6566F1] text-white hover:bg-[#5A5BD9] flex items-center justify-center"
                  >
                    {option.action}
                  </a>
                ) : (
                  <button
                    disabled={!option.available}
                    className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
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
      <div className="bg-white p-6 rounded-2xl shadow-sm border-0">
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
              className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900 group-hover:text-[#6566F1] transition-colors">
                    {link.title}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">{link.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#6566F1] transition-colors" />
              </div>
            </a>
          ))}
              </div>
      </div>
    </div>
  );
};

export default HelpPage;
