'use client';

import React from 'react';
import Link from 'next/link';
import { Shield } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Header */}
      <header className="pt-24 pb-20 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-8 leading-tight">
              <Shield className="inline w-12 h-12 text-blue-600 mr-4 align-middle" />
              Privacy Policy
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-medium">
              Your privacy and data security are our top priorities
            </p>
            <p className="text-gray-500 mt-4">Last updated: January 2025</p>
            <div className="mt-12 flex justify-center">
              <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"></div>
            </div>
          </div>
        </div>
      </header>

      <main className="py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white border border-gray-200 rounded-3xl p-10 shadow-xl prose max-w-none">
          <h2>1. Information We Collect</h2>
          <p>We collect information that you provide directly to us, including:</p>
          <ul>
            <li>Account information (name, email, password)</li>
            <li>Bot configurations and training data</li>
            <li>Chat conversations and transcripts</li>
            <li>Payment and billing information</li>
            <li>Usage data and analytics</li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide, maintain, and improve our services</li>
            <li>Process transactions and send related information</li>
            <li>Send technical notices and support messages</li>
            <li>Respond to your comments and questions</li>
            <li>Analyze usage patterns and optimize performance</li>
          </ul>

          <h2>3. Information Sharing</h2>
          <p>We do not sell your personal information. We may share your information with:</p>
          <ul>
            <li>Service providers who assist in our operations</li>
            <li>Professional advisors such as lawyers and accountants</li>
            <li>Law enforcement when required by law</li>
          </ul>

          <h2>4. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal information
            against unauthorized access, alteration, disclosure, or destruction. This includes encryption of data
            in transit and at rest, regular security audits, and access controls.
          </p>

          <h2>5. Data Retention</h2>
          <p>
            We retain your information for as long as your account is active or as needed to provide you services.
            You may request deletion of your account and data at any time.
          </p>

          <h2>6. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access your personal information</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Object to processing of your data</li>
            <li>Export your data</li>
          </ul>

          <h2>7. Cookies</h2>
          <p>
            We use cookies and similar tracking technologies to track activity on our service and hold certain information.
            See our <Link href="/cookie-policy" className="text-[#6566F1]">Cookie Policy</Link> for more details.
          </p>

          <h2>8. International Data Transfers</h2>
          <p>
            Your information may be transferred to and processed in countries other than your own. We ensure
            appropriate safeguards are in place for such transfers.
          </p>

          <h2>9. Children's Privacy</h2>
          <p>
            Our service is not intended for children under 13. We do not knowingly collect personal information
            from children under 13.
          </p>

          <h2>10. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting
            the new Privacy Policy on this page and updating the "Last updated" date.
          </p>

          <h2>11. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, please contact us at:
            <br />
            <a href="mailto:privacy@smartchat.com" className="text-[#6566F1]">privacy@smartchat.com</a>
          </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
