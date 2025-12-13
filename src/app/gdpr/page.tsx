'use client';

import React from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function GDPRPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f8fafc', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      {/* Navigation */}
      <Navigation />

      {/* Page Header */}
      <header className="border-b" style={{ background: 'linear-gradient(90deg, rgba(37,99,235,0.06), transparent)', borderColor: 'rgba(15,23,42,0.04)', padding: '120px 18px 36px 18px' }}>
        <div className="max-w-[980px] mx-auto px-4">
          <div className="flex items-center gap-3">
            <div className="w-[52px] h-[52px] rounded-[10px] flex items-center justify-center text-white font-bold text-lg" style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}>SC</div>
            <div>
              <h1 className="text-2xl md:text-[28px] font-bold text-[#0f172a] mb-1">GDPR Compliance</h1>
              <p className="text-[#6b7280] text-sm md:text-base">Your data protection rights under EU law</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[980px] mx-auto px-4 py-7 w-full">
        <article className="bg-white rounded-xl p-6 md:p-9" style={{ boxShadow: '0 6px 18px rgba(2,6,23,0.06)', border: '1px solid rgba(2,6,23,0.04)' }}>
          <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-6">Last updated: November 2025</div>

          <div className="space-y-6">
              <h2>What is GDPR?</h2>
              <p>
                The General Data Protection Regulation (GDPR) is a comprehensive data protection law that came into
                effect in May 2018. It gives individuals in the European Union greater control over their personal data
                and imposes strict obligations on organizations that process such data.
              </p>

              <h2>Your Rights Under GDPR</h2>

              <h3>Right to Access</h3>
              <p>You can request a copy of all personal data we hold about you.</p>

              <h3>Right to Rectification</h3>
              <p>You can request correction of inaccurate or incomplete data.</p>

              <h3>Right to Erasure ("Right to be Forgotten")</h3>
              <p>You can request deletion of your personal data in certain circumstances.</p>

              <h3>Right to Restriction of Processing</h3>
              <p>You can request that we limit how we use your data.</p>

              <h3>Right to Data Portability</h3>
              <p>You can request your data in a structured, machine-readable format.</p>

              <h3>Right to Object</h3>
              <p>You can object to certain types of processing, including direct marketing.</p>

              <h3>Rights Related to Automated Decision Making</h3>
              <p>You have rights regarding automated processing and profiling.</p>

              <h2>How We Comply with GDPR</h2>

              <h3>Lawful Basis for Processing</h3>
              <p>We process your data based on:</p>
              <ul>
                <li><strong>Consent:</strong> You have given clear consent for us to process your data</li>
                <li><strong>Contract:</strong> Processing is necessary to fulfill our contract with you</li>
                <li><strong>Legal Obligation:</strong> We need to comply with the law</li>
                <li><strong>Legitimate Interest:</strong> Processing is in our legitimate business interests</li>
              </ul>

              <h3>Data Protection Measures</h3>
              <ul>
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Access controls and authentication mechanisms</li>
                <li>Data minimization (we only collect what we need)</li>
                <li>Privacy by design and by default</li>
                <li>Data Protection Impact Assessments for high-risk processing</li>
              </ul>

              <h3>Data Transfers</h3>
              <p>
                When we transfer data outside the EU, we ensure appropriate safeguards are in place, such as:
              </p>
              <ul>
                <li>Standard Contractual Clauses approved by the EU Commission</li>
                <li>Adequacy decisions for certain countries</li>
                <li>Binding Corporate Rules</li>
              </ul>

              <h3>Data Breach Notification</h3>
              <p>
                In the event of a data breach that poses a risk to your rights and freedoms, we will notify you and
                the relevant supervisory authority within 72 hours of becoming aware of the breach.
              </p>

              <h2>Exercise Your Rights</h2>
              <p>
                To exercise any of your GDPR rights or if you have questions about how we handle your data:
              </p>
              <p>
                <strong>Email:</strong>{' '}
                <a href="mailto:privacy@smartchat.com" className="text-blue-600 hover:underline">
                  privacy@smartchat.com
                </a>
              </p>
              <p>
                <strong>Data Protection Officer:</strong>{' '}
                <a href="mailto:dpo@smartchat.com" className="text-blue-600 hover:underline">
                  dpo@smartchat.com
                </a>
              </p>
              <p>
                We will respond to your request within one month. If you are not satisfied with our response, you have
                the right to lodge a complaint with your local supervisory authority.
              </p>
            </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
