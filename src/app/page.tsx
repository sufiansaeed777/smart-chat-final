'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  Check, 
  MessageSquare, 
  Users, 
  Zap, 
  BarChart3, 
  Puzzle,
  Upload,
  Settings,
  Rocket,
  CheckCircle,
  Sparkles,
  Bot
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import TestimonialsSection from '@/components/TestimonialsSection';
import SmartCTAButton from '@/components/SmartCTAButton';

const LandingPage = () => {



  const benefits = [
    {
      icon: <Zap className="w-5 h-5" />,
      text: "Reduce support workload with an AI agent that answers instantly from your content"
    },
    {
      icon: <Users className="w-5 h-5" />,
      text: "Capture leads directly from chat and sync them to your CRM"
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      text: "Human handover in one click—never leave customers hanging"
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      text: "Real-time analytics to see what's working and what's not"
    },
    {
      icon: <Puzzle className="w-5 h-5" />,
      text: "Works out-of-the-box with Shopify and more"
    }
  ];






  const steps = [
    {
      icon: <Upload className="w-8 h-8" />,
      title: "Create Your Bot",
      description: "Upload docs or connect your site. Our AI learns from your content in minutes, not hours."
    },
    {
      icon: <Settings className="w-8 h-8" />,
      title: "Customize & Embed",
      description: "Configure tone, style, and install with one snippet or WP plugin. No coding required."
    },
    {
      icon: <Rocket className="w-8 h-8" />,
      title: "Engage & Grow",
      description: "Let AI handle support, capture leads, and escalate to humans when needed. Scale effortlessly."
    }
  ];





  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-white to-gray-50"></div>
        
        {/* Decorative elements */}
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute top-32 right-1/4 w-64 h-64 bg-purple-100 rounded-full blur-2xl opacity-60"></div>
        
        <div className="container mx-auto px-4 lg:px-8 relative">
          <div className="max-w-6xl mx-auto text-center">
            {/* Main headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              AI Chatbots That Actually{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Understand
              </span>{" "}
              Your Customers
            </h1>
            
            {/* Subheadline */}
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              For businesses, agencies, and website owners tired of clunky bots. Our SaaS platform makes it effortless to launch AI-powered chat, automate conversations, and seamlessly hand over to humans when needed.
            </p>
            
            {/* Benefits list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 max-w-3xl mx-auto">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start space-x-3 text-left">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center mt-0.5">
                    <div className="text-blue-600">
                      {benefit.icon}
                    </div>
                  </div>
                  <span className="text-sm md:text-base text-gray-600 leading-relaxed">
                    {benefit.text}
                  </span>
                </div>
              ))}
            </div>
            
            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <SmartCTAButton
                text="Get Started Free"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-semibold hover:shadow-xl transition-all duration-200"
              />
              <Link href="/product" className="border border-gray-300 text-gray-700 px-8 py-4 rounded-2xl font-semibold hover:bg-gray-50 transition-all duration-200">
                Watch Demo
              </Link>
            </div>
            
            {/* Trust indicators */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-600" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-600" />
                <span>5-minute setup</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-600" />
                <span>14-day free trial</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Advanced Testing Environment Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-0 rounded-3xl shadow-xl overflow-hidden">
              <CardContent className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  <div>
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-6 shadow-lg">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                      Advanced AI Testing & Optimization
            </h2>
                    <p className="text-lg text-gray-700 leading-relaxed mb-6">
                      Deploy AI chatbots with confidence using our comprehensive testing platform. 
                      Validate responses, optimize conversations, and ensure your AI delivers 
                      perfect customer experiences before going live.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <MessageSquare className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Live Testing</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Bot className="w-4 h-4 text-purple-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Multi-Bot Management</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <Zap className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Smart Analytics</span>
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      </div>
                      <div className="space-y-3">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm text-gray-600">Validating AI responses...</p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-3">
                          <p className="text-sm text-blue-800">Testing conversation scenarios...</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3">
                          <p className="text-sm text-green-800">Ready for deployment!</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>


      {/* Product Section */}
      <section id="product" className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-6xl mx-auto">
            {/* Product introduction */}
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Meet{" "}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  ChatBot Pro
                </span>
              </h2>
              <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                The AI Chatbot SaaS built for real businesses. With our advanced AI workflows and deep integrations, you can launch a powerful, reliable chatbot in minutes.
              </p>
            </div>

            {/* 3-step process */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {steps.map((step, index) => (
                <div key={index} className="relative">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white mb-6 shadow-lg">
                      {step.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                  
                  {/* Connection arrow */}
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-8 -right-4 transform translate-x-1/2">
                      <ArrowRight className="w-6 h-6 text-blue-600" />
                    </div>
                  )}
                </div>
              ))}
            </div>



            {/* Testimonials Section */}
            <div className="mt-16 mb-16">
              <TestimonialsSection />
            </div>

            {/* Final CTA */}
            <div className="mt-16 text-center">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 md:p-12 text-white">
                <h3 className="text-2xl md:text-3xl font-bold mb-4">
                  Ready to Transform Your Customer Experience?
                </h3>
                <p className="text-lg mb-6 opacity-90">
                  Start your free trial today and see the difference—no credit card required.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <SmartCTAButton
                    text="Launch My Chatbot"
                    className="bg-white text-blue-600 px-8 py-3 rounded-2xl font-semibold hover:bg-gray-50 transition-all duration-200"
                  />
                  <div className="flex items-center gap-2 text-sm opacity-90">
                    <CheckCircle className="w-4 h-4" />
                    <span>14-day free trial included</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Contact Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto text-center text-white relative overflow-hidden">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl mb-8">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            
            <h3 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              Ready to Get Started?
            </h3>
            
            <p className="text-xl text-blue-100 mb-8 leading-relaxed max-w-2xl mx-auto">
              Our AI experts are standing by to help you launch your first chatbot. Get personalized setup assistance and answers to all your questions.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button 
                className="group bg-white text-slate-900 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-blue-50 transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-2xl flex items-center gap-3"
                onClick={() => window.location.href = '/contact'}
              >
                <svg className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
                Get Expert Help
              </button>
              
              <div className="flex items-center gap-2 text-blue-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium">Usually responds within 2 hours</span>
              </div>
            </div>
            
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="space-y-3">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-white">Free Setup Consultation</h4>
                <p className="text-sm text-blue-200">No obligation, expert guidance</p>
              </div>
              
              <div className="space-y-3">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-white">Custom Integration</h4>
                <p className="text-sm text-blue-200">Tailored to your platform</p>
              </div>
              
              <div className="space-y-3">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-white">Priority Support</h4>
                <p className="text-sm text-blue-200">Dedicated success manager</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default LandingPage;
