import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, MessageCircle, Phone, Clock } from 'lucide-react';

export default function ContactSupportPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-[#6566F1] hover:text-[#5A5BD9] mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Support</h1>
          <p className="text-xl text-gray-600">
            Get in touch with our support team. We're here to help!
          </p>
        </div>

        {/* Contact Methods */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <Mail className="w-8 h-8 text-[#6566F1] mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Support</h3>
            <p className="text-gray-600 mb-4">Send us an email and we'll get back to you within 24 hours.</p>
            <a
              href="mailto:support@smartchat.com"
              className="text-[#6566F1] hover:text-[#5A5BD9] font-medium"
            >
              support@smartchat.com
            </a>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <MessageCircle className="w-8 h-8 text-[#6566F1] mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Live Chat</h3>
            <p className="text-gray-600 mb-4">Chat with our support team in real-time.</p>
            <button className="text-[#6566F1] hover:text-[#5A5BD9] font-medium">
              Start Chat
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <Phone className="w-8 h-8 text-[#6566F1] mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Phone Support</h3>
            <p className="text-gray-600 mb-4">Call us during business hours (Mon-Fri, 9AM-5PM EST).</p>
            <a
              href="tel:+1234567890"
              className="text-[#6566F1] hover:text-[#5A5BD9] font-medium"
            >
              +1 (234) 567-890
            </a>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <Clock className="w-8 h-8 text-[#6566F1] mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Response Time</h3>
            <p className="text-gray-600">
              Email: Within 24 hours<br />
              Live Chat: Immediate<br />
              Phone: Business hours only
            </p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Send Us a Message</h2>

          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6566F1] focus:border-transparent"
                  placeholder="John"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6566F1] focus:border-transparent"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6566F1] focus:border-transparent"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6566F1] focus:border-transparent"
                placeholder="How can we help you?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6566F1] focus:border-transparent"
                placeholder="Describe your question or issue..."
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#6566F1] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#5A5BD9] transition-colors"
            >
              Send Message
            </button>
          </form>
        </div>

        {/* Help Center Link */}
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Looking for quick answers? Check out our Help Center.
          </p>
          <Link
            href="/help-center"
            className="text-[#6566F1] hover:text-[#5A5BD9] font-medium"
          >
            Visit Help Center →
          </Link>
        </div>
      </div>
    </div>
  );
}
