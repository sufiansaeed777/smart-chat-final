'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Book, MessageSquare, FileText, HelpCircle, Wrench, Play } from 'lucide-react';

export default function HelpCenterPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-[#6566F1] hover:text-[#5A5BD9] mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Help Center</h1>
          <p className="text-xl text-gray-600">
            Find answers to common questions and get support for your chatbot needs.
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <Book className="w-8 h-8 text-[#6566F1] mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Getting Started</h3>
            <p className="text-gray-600 mb-4">Learn how to set up and configure your first chatbot.</p>
            <Link href="#getting-started" className="text-[#6566F1] hover:text-[#5A5BD9] font-medium">
              Learn more →
            </Link>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <MessageSquare className="w-8 h-8 text-[#6566F1] mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Contact Support</h3>
            <p className="text-gray-600 mb-4">Get help from our support team via email or chat.</p>
            <Link href="/contact-support" className="text-[#6566F1] hover:text-[#5A5BD9] font-medium">
              Contact us →
            </Link>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <FileText className="w-8 h-8 text-[#6566F1] mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Documentation</h3>
            <p className="text-gray-600 mb-4">Detailed guides and API documentation.</p>
            <Link href="#documentation" className="text-[#6566F1] hover:text-[#5A5BD9] font-medium">
              View docs →
            </Link>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <HelpCircle className="w-8 h-8 text-[#6566F1] mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">FAQs</h3>
            <p className="text-gray-600 mb-4">Answers to frequently asked questions.</p>
            <Link href="#faqs" className="text-[#6566F1] hover:text-[#5A5BD9] font-medium">
              Read FAQs →
            </Link>
          </div>
        </div>

        {/* Getting Started Section */}
        <div id="getting-started" className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 mb-8 scroll-mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Book className="w-6 h-6 text-[#6566F1] mr-3" />
            Getting Started Guide
          </h2>

          <div className="space-y-6">
            <div className="border-l-4 border-[#6566F1] pl-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Step 1: Create Your Account</h3>
              <p className="text-gray-600">
                Sign up for a free account to get started. You'll need to verify your email address to activate your account.
              </p>
            </div>

            <div className="border-l-4 border-[#6566F1] pl-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Step 2: Create Your First Bot</h3>
              <p className="text-gray-600">
                Navigate to the Bots section in your dashboard. Click "Create Bot" and give it a name and description.
                This will be your AI-powered chatbot.
              </p>
            </div>

            <div className="border-l-4 border-[#6566F1] pl-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Step 3: Train Your Bot</h3>
              <p className="text-gray-600">
                Upload documents (PDF, DOCX, TXT) or enter content directly. Your bot will learn from this content
                to answer questions accurately.
              </p>
            </div>

            <div className="border-l-4 border-[#6566F1] pl-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Step 4: Deploy Your Bot</h3>
              <p className="text-gray-600">
                Get your embed code or WordPress plugin token from the Integrations section. Add the chat widget
                to your website and start engaging with visitors!
              </p>
            </div>
          </div>

          {/* Video Tutorial */}
          <div className="mt-8 bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Play className="w-5 h-5 text-[#6566F1] mr-2" />
              Video Tutorial
            </h3>
            <p className="text-gray-600 mb-4">
              Watch our step-by-step video guide to set up your first chatbot in under 5 minutes.
            </p>
            <Link
              href="/support#video-tutorials"
              className="text-[#6566F1] hover:text-[#5A5BD9] font-medium"
            >
              Watch Video →
            </Link>
          </div>
        </div>

        {/* FAQs Section */}
        <div id="faqs" className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 mb-8 scroll-mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <HelpCircle className="w-6 h-6 text-[#6566F1] mr-3" />
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How do I create a chatbot?</h3>
              <p className="text-gray-600">
                Sign up for an account, navigate to the Bots section, click "Create Bot", and follow the setup wizard.
                You can customize your bot's personality, upload training documents, and configure the chat widget.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What file formats are supported for training?</h3>
              <p className="text-gray-600">
                We support PDF, DOCX, TXT, CSV, and JSON files. You can upload multiple documents to train your bot
                on your custom content.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How do I add the chatbot to my WordPress site?</h3>
              <p className="text-gray-600">
                Install our WordPress plugin, generate an authentication token from your dashboard, and configure
                the plugin with your bot's token. The chat widget will automatically appear on your site.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What are the pricing plans?</h3>
              <p className="text-gray-600">
                We offer multiple plans with different limits on monthly conversations, number of bots, and storage.
                Visit our pricing page or dashboard to see plan details and upgrade options.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Can I customize the chat widget appearance?</h3>
              <p className="text-gray-600">
                Yes! You can customize colors, position, greeting message, and more from the bot settings in your dashboard.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">My bot is not responding correctly. What should I do?</h3>
              <p className="text-gray-600">
                First, check that your bot is trained with relevant content. Make sure the training documents are clear
                and contain the information your visitors are asking about. You can also adjust the bot's system prompt
                to improve responses.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How do I enable human handoff?</h3>
              <p className="text-gray-600">
                Human handoff allows visitors to request a live agent. Enable it in your bot settings and configure
                when the handoff should be triggered (e.g., on specific keywords or after a certain number of messages).
              </p>
            </div>
          </div>
        </div>

        {/* Documentation Section */}
        <div id="documentation" className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 mb-8 scroll-mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <FileText className="w-6 h-6 text-[#6566F1] mr-3" />
            Documentation
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="#getting-started" className="p-4 border border-gray-200 rounded-lg hover:border-[#6566F1] transition-colors">
              <h3 className="font-semibold text-gray-900 mb-1">Quick Start Guide</h3>
              <p className="text-sm text-gray-600">Get up and running in minutes</p>
            </Link>

            <Link href="#faqs" className="p-4 border border-gray-200 rounded-lg hover:border-[#6566F1] transition-colors">
              <h3 className="font-semibold text-gray-900 mb-1">API Reference</h3>
              <p className="text-sm text-gray-600">Integrate with our REST API</p>
            </Link>

            <Link href="#faqs" className="p-4 border border-gray-200 rounded-lg hover:border-[#6566F1] transition-colors">
              <h3 className="font-semibold text-gray-900 mb-1">WordPress Integration</h3>
              <p className="text-sm text-gray-600">Install and configure the WP plugin</p>
            </Link>

            <Link href="#faqs" className="p-4 border border-gray-200 rounded-lg hover:border-[#6566F1] transition-colors">
              <h3 className="font-semibold text-gray-900 mb-1">Webhook Events</h3>
              <p className="text-sm text-gray-600">Handle real-time notifications</p>
            </Link>
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-[#6566F1] text-white p-8 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Still need help?</h2>
          <p className="mb-6">
            Our support team is here to help you with any questions or issues.
          </p>
          <Link
            href="/contact-support"
            className="inline-block bg-white text-[#6566F1] px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
