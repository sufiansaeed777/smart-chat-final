import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-[#6566F1] hover:text-[#5A5BD9] mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-gray-600">Last updated: January 2025</p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 prose max-w-none">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using this service, you accept and agree to be bound by the terms and provision of this agreement.
            If you do not agree to these terms, please do not use our service.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            We provide an AI chatbot platform that enables users to create, train, and deploy chatbots on their websites.
            The service includes bot creation, document training, WordPress integration, and analytics.
          </p>

          <h2>3. User Accounts</h2>
          <p>To use our service, you must:</p>
          <ul>
            <li>Create an account with accurate information</li>
            <li>Be at least 18 years old</li>
            <li>Maintain the security of your account</li>
            <li>Not share your account credentials</li>
            <li>Notify us immediately of any unauthorized use</li>
          </ul>

          <h2>4. Acceptable Use</h2>
          <p>You agree not to use the service to:</p>
          <ul>
            <li>Violate any laws or regulations</li>
            <li>Infringe on intellectual property rights</li>
            <li>Distribute malware or harmful code</li>
            <li>Harass, abuse, or harm others</li>
            <li>Collect user data without consent</li>
            <li>Impersonate others or misrepresent affiliation</li>
          </ul>

          <h2>5. Content and Data</h2>
          <p>
            You retain ownership of content you upload to our service. By uploading content, you grant us a license
            to use, store, and process that content solely to provide the service to you.
          </p>

          <h2>6. Payment Terms</h2>
          <p>
            Paid plans are billed on a subscription basis. You agree to pay all fees according to the pricing and
            payment terms in effect at the time. Fees are non-refundable except as required by law.
          </p>

          <h2>7. Service Limits</h2>
          <p>
            Your plan includes limits on monthly conversations, number of bots, and storage. Exceeding these limits
            may result in service interruption or additional charges.
          </p>

          <h2>8. Termination</h2>
          <p>
            We may terminate or suspend your account immediately, without prior notice, for conduct that we believe
            violates these Terms or is harmful to other users, us, or third parties.
          </p>

          <h2>9. Disclaimer of Warranties</h2>
          <p>
            The service is provided "as is" without warranties of any kind. We do not guarantee that the service
            will be uninterrupted, secure, or error-free.
          </p>

          <h2>10. Limitation of Liability</h2>
          <p>
            We shall not be liable for any indirect, incidental, special, consequential, or punitive damages
            resulting from your use of or inability to use the service.
          </p>

          <h2>11. Indemnification</h2>
          <p>
            You agree to indemnify and hold us harmless from any claims, damages, or expenses arising from your
            use of the service or violation of these terms.
          </p>

          <h2>12. Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. We will notify users of material changes.
            Continued use after changes constitutes acceptance of the new terms.
          </p>

          <h2>13. Governing Law</h2>
          <p>
            These terms shall be governed by and construed in accordance with applicable laws, without regard to
            conflict of law provisions.
          </p>

          <h2>14. Contact</h2>
          <p>
            For questions about these Terms, contact us at:
            <br />
            <a href="mailto:legal@smartchat.com" className="text-[#6566F1]">legal@smartchat.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}
