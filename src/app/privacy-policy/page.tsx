'use client';

import React from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f8fafc', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      {/* Navigation */}
      <Navigation />

      {/* Page Header */}
      <header className="border-b pt-20" style={{ background: 'linear-gradient(90deg, rgba(124,58,237,0.06), transparent)', borderColor: 'rgba(15,23,42,0.04)', padding: '36px 18px' }}>
        <div className="max-w-[980px] mx-auto px-4">
          <div className="flex items-center gap-3">
            <div className="w-[52px] h-[52px] rounded-[10px] flex items-center justify-center text-white font-bold text-lg" style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>SC</div>
            <div>
              <h1 className="text-2xl md:text-[28px] font-bold text-[#0f172a] mb-1">Privacy Policy</h1>
              <p className="text-[#6b7280] text-sm md:text-base">How <strong>Smart Chat</strong> collects, uses, and protects your data</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[980px] mx-auto px-4 py-7 w-full">
        <article className="bg-white rounded-xl p-6 md:p-9" style={{ boxShadow: '0 6px 18px rgba(2,6,23,0.06)', border: '1px solid rgba(2,6,23,0.04)' }}>
          <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 text-sm font-medium mb-6">Last updated: November 2025</div>

          <div className="space-y-6">
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
                See our <Link href="/cookie-policy" className="text-blue-600 hover:underline">Cookie Policy</Link> for more details.
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
                <a href="mailto:privacy@smartchat.com" className="text-purple-600 hover:underline">privacy@smartchat.com</a>
              </p>
            </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
