import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Book, MessageSquare, FileText, HelpCircle } from 'lucide-react';

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

        {/* FAQs Section */}
        <div id="faqs" className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>

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
