import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Check } from 'lucide-react';

export default function GDPRPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-[#6566F1] hover:text-[#5A5BD9] mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">GDPR Compliance</h1>
          <p className="text-xl text-gray-600">
            Our commitment to data protection and privacy rights under GDPR.
          </p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="flex items-start mb-6">
            <Shield className="w-12 h-12 text-[#6566F1] mr-4 flex-shrink-0" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">What is GDPR?</h2>
              <p className="text-gray-600">
                The General Data Protection Regulation (GDPR) is a comprehensive data protection law that came into
                effect in May 2018. It gives individuals in the European Union greater control over their personal data
                and imposes strict obligations on organizations that process such data.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Rights Under GDPR</h2>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <Check className="w-5 h-5 text-[#6566F1] mr-3 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Right to Access</h3>
                <p className="text-gray-600">You can request a copy of all personal data we hold about you.</p>
              </div>
            </div>

            <div className="flex items-start">
              <Check className="w-5 h-5 text-[#6566F1] mr-3 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Right to Rectification</h3>
                <p className="text-gray-600">You can request correction of inaccurate or incomplete data.</p>
              </div>
            </div>

            <div className="flex items-start">
              <Check className="w-5 h-5 text-[#6566F1] mr-3 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Right to Erasure ("Right to be Forgotten")</h3>
                <p className="text-gray-600">You can request deletion of your personal data in certain circumstances.</p>
              </div>
            </div>

            <div className="flex items-start">
              <Check className="w-5 h-5 text-[#6566F1] mr-3 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Right to Restriction of Processing</h3>
                <p className="text-gray-600">You can request that we limit how we use your data.</p>
              </div>
            </div>

            <div className="flex items-start">
              <Check className="w-5 h-5 text-[#6566F1] mr-3 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Right to Data Portability</h3>
                <p className="text-gray-600">You can request your data in a structured, machine-readable format.</p>
              </div>
            </div>

            <div className="flex items-start">
              <Check className="w-5 h-5 text-[#6566F1] mr-3 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Right to Object</h3>
                <p className="text-gray-600">You can object to certain types of processing, including direct marketing.</p>
              </div>
            </div>

            <div className="flex items-start">
              <Check className="w-5 h-5 text-[#6566F1] mr-3 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Rights Related to Automated Decision Making</h3>
                <p className="text-gray-600">You have rights regarding automated processing and profiling.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 mb-8 prose max-w-none">
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
        </div>

        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Exercise Your Rights</h2>
          <p className="text-gray-600 mb-4">
            To exercise any of your GDPR rights or if you have questions about how we handle your data:
          </p>
          <div className="space-y-2">
            <p className="text-gray-900">
              <strong>Email:</strong>{' '}
              <a href="mailto:privacy@smartchat.com" className="text-[#6566F1] hover:text-[#5A5BD9]">
                privacy@smartchat.com
              </a>
            </p>
            <p className="text-gray-900">
              <strong>Data Protection Officer:</strong>{' '}
              <a href="mailto:dpo@smartchat.com" className="text-[#6566F1] hover:text-[#5A5BD9]">
                dpo@smartchat.com
              </a>
            </p>
          </div>
          <p className="text-gray-600 mt-4">
            We will respond to your request within one month. If you are not satisfied with our response, you have
            the right to lodge a complaint with your local supervisory authority.
          </p>
        </div>
      </div>
    </div>
  );
}
