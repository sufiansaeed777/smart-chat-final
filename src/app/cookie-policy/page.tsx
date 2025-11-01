import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-[#6566F1] hover:text-[#5A5BD9] mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Cookie Policy</h1>
          <p className="text-gray-600">Last updated: January 2025</p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 prose max-w-none">
          <h2>1. What Are Cookies</h2>
          <p>
            Cookies are small text files that are stored on your device when you visit a website. They help the
            website remember information about your visit, such as your preferences and login status.
          </p>

          <h2>2. How We Use Cookies</h2>
          <p>We use cookies for the following purposes:</p>
          <ul>
            <li><strong>Authentication:</strong> To keep you logged in across sessions</li>
            <li><strong>Preferences:</strong> To remember your settings and preferences</li>
            <li><strong>Analytics:</strong> To understand how users interact with our service</li>
            <li><strong>Security:</strong> To protect against fraudulent activity</li>
            <li><strong>Performance:</strong> To optimize loading times and user experience</li>
          </ul>

          <h2>3. Types of Cookies We Use</h2>
          
          <h3>Essential Cookies</h3>
          <p>
            These cookies are necessary for the website to function properly. They enable core functionality such
            as security, authentication, and load balancing.
          </p>

          <h3>Performance Cookies</h3>
          <p>
            These cookies collect information about how you use our website, such as which pages you visit most often.
            This data helps us improve how our website works.
          </p>

          <h3>Functionality Cookies</h3>
          <p>
            These cookies allow our website to remember choices you make (such as your username, language, or region)
            and provide enhanced, personalized features.
          </p>

          <h3>Analytics Cookies</h3>
          <p>
            We use analytics cookies to collect information about visitor behavior. This helps us understand which
            pages are popular and identify areas for improvement.
          </p>

          <h2>4. Third-Party Cookies</h2>
          <p>
            We may use third-party services that set cookies on your device. These include:
          </p>
          <ul>
            <li><strong>Google Analytics:</strong> For website analytics</li>
            <li><strong>Stripe:</strong> For payment processing</li>
            <li><strong>OpenAI:</strong> For AI chat functionality</li>
          </ul>

          <h2>5. Managing Cookies</h2>
          <p>
            Most web browsers allow you to control cookies through their settings. You can typically:
          </p>
          <ul>
            <li>View what cookies are stored</li>
            <li>Delete existing cookies</li>
            <li>Block cookies from being set</li>
            <li>Block third-party cookies</li>
          </ul>
          <p>
            Note that blocking or deleting cookies may impact the functionality of our service. Some features may
            not work properly without cookies enabled.
          </p>

          <h2>6. Cookie Consent</h2>
          <p>
            When you first visit our website, you will see a cookie consent banner. By clicking "Accept" or continuing
            to use the site, you consent to our use of cookies as described in this policy.
          </p>

          <h2>7. Do Not Track Signals</h2>
          <p>
            Some browsers have a "Do Not Track" feature. We currently do not respond to Do Not Track signals, but
            we respect your right to control your data through browser settings.
          </p>

          <h2>8. Updates to This Policy</h2>
          <p>
            We may update this Cookie Policy from time to time. Any changes will be posted on this page with an
            updated revision date.
          </p>

          <h2>9. Contact Us</h2>
          <p>
            If you have questions about our use of cookies, contact us at:
            <br />
            <a href="mailto:privacy@smartchat.com" className="text-[#6566F1]">privacy@smartchat.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}
