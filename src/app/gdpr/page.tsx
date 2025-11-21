'use client';

import React from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function GDPRPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="py-16 mt-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">GDPR Compliance</h1>

            <div className="prose max-w-none">
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
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
