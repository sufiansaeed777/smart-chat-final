import React from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, Shield, Cookie, Globe } from 'lucide-react';

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-[#6566F1] hover:text-[#5A5BD9] mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Legal</h1>
          <p className="text-xl text-gray-600">
            Important legal information and policies.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Link href="/terms-of-service" className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <FileText className="w-8 h-8 text-[#6566F1] mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Terms of Service</h3>
            <p className="text-gray-600 mb-4">Our terms and conditions for using the service.</p>
            <span className="text-[#6566F1] font-medium">Read Terms →</span>
          </Link>

          <Link href="/privacy-policy" className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <Shield className="w-8 h-8 text-[#6566F1] mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Privacy Policy</h3>
            <p className="text-gray-600 mb-4">How we collect, use, and protect your data.</p>
            <span className="text-[#6566F1] font-medium">Read Policy →</span>
          </Link>

          <Link href="/cookie-policy" className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <Cookie className="w-8 h-8 text-[#6566F1] mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Cookie Policy</h3>
            <p className="text-gray-600 mb-4">Information about cookies and tracking technologies.</p>
            <span className="text-[#6566F1] font-medium">Read Policy →</span>
          </Link>

          <Link href="/gdpr" className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <Globe className="w-8 h-8 text-[#6566F1] mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">GDPR Compliance</h3>
            <p className="text-gray-600 mb-4">Our commitment to GDPR and data protection.</p>
            <span className="text-[#6566F1] font-medium">Learn More →</span>
          </Link>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Legal Inquiries</h2>
          <p className="text-gray-600 mb-4">For legal questions or concerns, please contact our legal team:</p>
          <a href="mailto:legal@smartchat.com" className="text-[#6566F1] hover:text-[#5A5BD9] font-medium">legal@smartchat.com</a>
        </div>
      </div>
    </div>
  );
}
