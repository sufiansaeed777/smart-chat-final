'use client';

import Link from 'next/link';
import { MessageCircle, Bot, Zap, Shield, BarChart3 } from "lucide-react";
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import TestimonialsSection from '@/components/TestimonialsSection';
import SmartCTAButton from '@/components/SmartCTAButton';
import { useChatBot } from '@/contexts/ChatBotContext';

const ProductPage = () => {
  const { triggerChat } = useChatBot();

  const features = [
    {
      icon: <Zap className="w-6 h-6 text-yellow-500" />,
      title: "Lightning Fast Setup",
      description: "Get your chatbot running in under 5 minutes with our streamlined onboarding process."
    },
    {
      icon: <Shield className="w-6 h-6 text-green-500" />,
      title: "Enterprise Security",
      description: "Bank-level encryption and compliance with SOC 2, GDPR, and HIPAA standards."
    },
    {
      icon: <MessageCircle className="w-6 h-6 text-blue-500" />,
      title: "Natural Conversations",
      description: "Advanced AI that understands context and provides human-like responses."
    },
    {
      icon: <Bot className="w-6 h-6 text-purple-500" />,
      title: "Multi-Platform Support",
      description: "Deploy on your website, Shopify, or integrate with existing systems."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center pt-24 pb-16 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-blue-100 text-blue-600 px-4 py-2 rounded-full text-sm font-medium">
                ✨ AI-Powered Product
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-8">
              The Complete{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI Chatbot Platform
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-8">
              Build, deploy, and optimize intelligent chatbots that actually understand your customers. 
              No technical skills required.
            </p>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10">
              Join thousands of businesses using our platform to provide 24/7 customer support, 
              capture leads, and scale their operations without hiring more staff.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <SmartCTAButton
                text="Start Building Free"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-2xl font-medium text-lg hover:opacity-90 transition-opacity text-center"
              />
              <button
                onClick={triggerChat}
                className="border border-gray-300 text-gray-700 px-8 py-3 rounded-2xl font-medium text-lg hover:bg-gray-50 transition-colors text-center"
              >
                Watch Demo
              </button>
            </div>
            <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>No credit card required</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Setup in 5 minutes</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From setup to optimization, we&apos;ve made building AI chatbots as simple as possible.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Create Your Bot Tile */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                <Bot className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Create Your Bot</h3>
              <p className="text-gray-600 leading-relaxed text-center">
                Build your AI chatbot in minutes with our intuitive drag-and-drop interface. No coding required.
              </p>
            </div>

            {/* Train & Deploy Tile */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-100 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="w-8 h-8 text-green-600" />
                </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Train & Deploy</h3>
              <p className="text-gray-600 leading-relaxed text-center">
                Upload your content, train the AI on your business data, and deploy across all platforms instantly.
              </p>
            </div>

            {/* Monitor & Optimize Tile */}
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-8 border border-purple-100 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Monitor & Optimize</h3>
              <p className="text-gray-600 leading-relaxed text-center">
                Track performance, analyze conversations, and continuously improve your bot&apos;s effectiveness.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to create exceptional customer experiences with AI.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="bg-gray-50 rounded-lg p-3 flex-shrink-0">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Founder Message */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center">
            <h3 className="text-2xl font-bold mb-4">
              &ldquo;We built this because we were tired of complex, expensive chatbot tools.&rdquo;
            </h3>
            <p className="text-xl opacity-90 mb-6">
              After struggling with existing solutions, we created the chatbot platform we wished existed. 
              Simple, powerful, and affordable for businesses of all sizes.
            </p>
            <div className="flex items-center justify-center space-x-4">
              <img 
                src="/images/ceo-photo.jpg?v=1" 
                alt="Sarah Johnson, Founder & CEO" 
                className="w-12 h-12 rounded-full object-cover border-2 border-white/30"
              />
              <div className="text-left">
                <p className="font-semibold">Sarah Johnson</p>
                <p className="opacity-75">Founder & CEO</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Powerful Features for Your Business
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to create exceptional customer experiences with AI chatbots
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* AI Chatbot Creation */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <Bot className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Create AI Chatbots</h3>
              <ul className="text-gray-600 space-y-2">
                <li>• Build multiple AI agents for different purposes</li>
                <li>• Customize personality and tone</li>
                <li>• Automatic language detection</li>
                <li>• Upload your own training materials</li>
              </ul>
            </div>

            {/* Easy WordPress Integration */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-100">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <MessageCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">WordPress Integration</h3>
              <ul className="text-gray-600 space-y-2">
                <li>• Simple plugin installation</li>
                <li>• Customizable chat widget</li>
                <li>• Automatic quota management</li>
                <li>• Seamless website integration</li>
              </ul>
            </div>

            {/* Customer Insights */}
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-8 border border-purple-100">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Customer Insights</h3>
              <ul className="text-gray-600 space-y-2">
                <li>• Track all customer conversations</li>
                <li>• Measure customer satisfaction</li>
                <li>• Understand common questions</li>
                <li>• Export conversation history</li>
              </ul>
            </div>

            {/* Business Security */}
            <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-8 border border-red-100">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Business Security</h3>
              <ul className="text-gray-600 space-y-2">
                <li>• Secure customer data protection</li>
                <li>• GDPR compliance ready</li>
                <li>• Professional security standards</li>
                <li>• Safe for enterprise use</li>
              </ul>
            </div>

            {/* Flexible Billing */}
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl p-8 border border-yellow-100">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Flexible Billing</h3>
              <ul className="text-gray-600 space-y-2">
                <li>• Choose your plan size</li>
                <li>• Free trial to start</li>
                <li>• Easy subscription management</li>
                <li>• Automatic billing</li>
              </ul>
            </div>

            {/* Smart Automation */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-8 border border-indigo-100">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
                <Bot className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Smart Automation</h3>
              <ul className="text-gray-600 space-y-2">
                <li>• Automated customer responses</li>
                <li>• Smart conversation handling</li>
                <li>• Automatic email notifications</li>
                <li>• Intelligent routing</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Business Benefits */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Why Choose Our AI Chatbot Platform?
          </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Transform your customer support and grow your business with intelligent automation
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Customer Experience */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Better Customer Experience</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-700">24/7 customer support availability</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-700">Instant responses to common questions</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-700">Multilingual support for global customers</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-700">Personalized customer interactions</span>
                </div>
              </div>
            </div>

            {/* Business Growth */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Business Growth</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700">Reduce support costs by up to 70%</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700">Capture more leads and sales</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700">Scale customer support effortlessly</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700">Focus on growing your business</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials">
        <TestimonialsSection />
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default ProductPage;
