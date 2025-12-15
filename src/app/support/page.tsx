'use client';

import React from 'react';
import Link from 'next/link';
import { HelpCircle, MessageSquare, Activity, Users, ArrowRight } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useChatBot } from '@/contexts/ChatBotContext';

const SupportPage = () => {
  const { triggerChat } = useChatBot();

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      {/* Header */}
      <header className="pt-24 pb-20 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-8 leading-tight">
              Support Center
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-medium">
              Get the help you need to make the most of our platform and services.
            </p>
            <div className="mt-12 flex justify-center">
              <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-6xl mx-auto space-y-20">
            
            {/* Help Center */}
            <section id="help-center" className="scroll-mt-24">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                  <HelpCircle className="inline w-12 h-12 text-blue-600 mr-4 align-middle" />
                  Help Center
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto font-medium leading-relaxed">
                  Comprehensive guides and resources to help you get started and solve common issues
                </p>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-3xl p-10 shadow-xl">
                <div className="grid md:grid-cols-2 gap-12">
                  <div>
                    <div className="flex items-center mb-6">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-4"></div>
                      <h3 className="text-2xl font-bold text-gray-900">Getting Started</h3>
                    </div>
                    <p className="text-gray-700 leading-relaxed text-lg mb-6">
                      New to our platform? Start here with step-by-step guides to set up your account,
                      configure your first chatbot, and understand the basics.
                    </p>
                    <Link
                      href="/help-center#getting-started"
                      className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                    >
                      View Getting Started Guide
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </div>

                  <div>
                    <div className="flex items-center mb-6">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-4"></div>
                      <h3 className="text-2xl font-bold text-gray-900">Troubleshooting</h3>
                    </div>
                    <p className="text-gray-700 leading-relaxed text-lg mb-6">
                      Experiencing issues? Our troubleshooting guides cover common problems and their solutions
                      to get you back up and running quickly.
                    </p>
                    <Link
                      href="/troubleshooting"
                      className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                    >
                      Browse Solutions
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </div>
                  
                  <div className="md:col-span-2">
                    <div className="flex items-center mb-6">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-4"></div>
                      <h3 className="text-2xl font-bold text-gray-900">Video Tutorials</h3>
                    </div>
                    <p className="text-gray-700 leading-relaxed text-lg">
                      Prefer visual learning? Watch our comprehensive video tutorials covering everything from 
                      basic setup to advanced features and integrations.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Contact Support */}
            <section id="contact-support" className="scroll-mt-24">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                  <MessageSquare className="inline w-12 h-12 text-green-600 mr-4 align-middle" />
                  Contact Support
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto font-medium leading-relaxed">
                  Get in touch with our expert support team for personalized assistance
                </p>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-3xl p-10 shadow-xl">
                <div className="grid md:grid-cols-2 gap-12">
                  <div>
                    <div className="flex items-center mb-6">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-4"></div>
                      <h3 className="text-2xl font-bold text-gray-900">Live Chat</h3>
                    </div>
                    <p className="text-gray-700 leading-relaxed text-lg mb-6">
                      Chat with our support team in real-time. Available during business hours for immediate
                      assistance with urgent issues.
                    </p>
                    <button
                      onClick={triggerChat}
                      className="inline-flex items-center text-green-600 hover:text-green-700 font-semibold transition-colors"
                    >
                      Start Chat
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </button>
                  </div>
                  
                  <div>
                    <div className="flex items-center mb-6">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-4"></div>
                      <h3 className="text-2xl font-bold text-gray-900">Email Support</h3>
                    </div>
                    <p className="text-gray-700 leading-relaxed text-lg mb-6">
                      Send us a detailed message and we&apos;ll respond within 24 hours. Perfect for complex 
                      issues that require thorough investigation.
                    </p>
                    <a
                      href="mailto:support@smartchat.com"
                      className="inline-flex items-center text-green-600 hover:text-green-700 font-semibold transition-colors"
                    >
                      Send Email
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </a>
                  </div>
                  
                  <div className="md:col-span-2">
                    <div className="flex items-center mb-6">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-4"></div>
                      <h3 className="text-2xl font-bold text-gray-900">Priority Support</h3>
                    </div>
                    <p className="text-gray-700 leading-relaxed text-lg">
                      Premium customers get priority support with faster response times and dedicated 
                      support representatives for critical business needs.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Status Page */}
            <section id="status-page" className="scroll-mt-24">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                  <Activity className="inline w-12 h-12 text-orange-600 mr-4 align-middle" />
                  Status Page
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto font-medium leading-relaxed">
                  Real-time updates on system status, maintenance, and performance
                </p>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-3xl p-10 shadow-xl">
                <div className="grid md:grid-cols-2 gap-12">
                  <div>
                    <div className="flex items-center mb-6">
                      <div className="w-3 h-3 bg-orange-500 rounded-full mr-4"></div>
                      <h3 className="text-2xl font-bold text-gray-900">System Status</h3>
                    </div>
                    <p className="text-gray-700 leading-relaxed text-lg mb-6">
                      Check the current status of all our services, APIs, and integrations. 
                      Get instant updates on any ongoing issues or maintenance.
                    </p>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span className="text-orange-600 font-semibold">All Systems Operational</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center mb-6">
                      <div className="w-3 h-3 bg-orange-500 rounded-full mr-4"></div>
                      <h3 className="text-2xl font-bold text-gray-900">Performance Metrics</h3>
                    </div>
                    <p className="text-gray-700 leading-relaxed text-lg mb-6">
                      Monitor response times, uptime, and performance metrics across all our services. 
                      Transparent reporting on our platform&apos;s reliability.
                    </p>
                    <div className="text-sm text-gray-500">
                      <p>Uptime: 99.9%</p>
                      <p>Response Time: &lt;200ms</p>
                    </div>
                  </div>
                  
                  <div className="md:col-span-2">
                    <div className="flex items-center mb-6">
                      <div className="w-3 h-3 bg-orange-500 rounded-full mr-4"></div>
                      <h3 className="text-2xl font-bold text-gray-900">Maintenance Schedule</h3>
                    </div>
                    <p className="text-gray-700 leading-relaxed text-lg">
                      Stay informed about planned maintenance windows and updates. We schedule maintenance 
                      during low-traffic hours to minimize disruption to your services.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Community */}
            <section id="community" className="scroll-mt-24">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                  <Users className="inline w-12 h-12 text-purple-600 mr-4 align-middle" />
                  Community
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto font-medium leading-relaxed">
                  Connect with other users, share experiences, and learn from the community
                </p>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-3xl p-10 shadow-xl">
                <div className="grid md:grid-cols-2 gap-12">
                  <div>
                    <div className="flex items-center mb-6">
                      <div className="w-3 h-3 bg-purple-500 rounded-full mr-4"></div>
                      <h3 className="text-2xl font-bold text-gray-900">User Forums</h3>
                    </div>
                    <p className="text-gray-700 leading-relaxed text-lg mb-6">
                      Join discussions with other users, ask questions, and share your experiences. 
                      Our community is a great place to learn tips and tricks.
                    </p>
                    <Link
                      href="/community"
                      className="inline-flex items-center text-purple-600 hover:text-purple-700 font-semibold transition-colors"
                    >
                      Join Discussion
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </div>
                  
                  <div>
                    <div className="flex items-center mb-6">
                      <div className="w-3 h-3 bg-purple-500 rounded-full mr-4"></div>
                      <h3 className="text-2xl font-bold text-gray-900">Knowledge Base</h3>
                    </div>
                    <p className="text-gray-700 leading-relaxed text-lg mb-6">
                      Access our comprehensive knowledge base with articles, tutorials, and best practices
                      contributed by both our team and community members.
                    </p>
                    <Link
                      href="/knowledge-base"
                      className="inline-flex items-center text-purple-600 hover:text-purple-700 font-semibold transition-colors"
                    >
                      Browse Articles
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </div>
                  
                  <div className="md:col-span-2">
                    <div className="flex items-center mb-6">
                      <div className="w-3 h-3 bg-purple-500 rounded-full mr-4"></div>
                      <h3 className="text-2xl font-bold text-gray-900">Events & Webinars</h3>
                    </div>
                    <p className="text-gray-700 leading-relaxed text-lg">
                      Attend virtual events, webinars, and workshops to deepen your knowledge and connect 
                      with industry experts and fellow users.
                    </p>
                  </div>
                </div>
              </div>
            </section>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SupportPage;
