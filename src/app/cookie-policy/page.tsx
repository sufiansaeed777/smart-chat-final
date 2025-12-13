'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function CookiePolicyPage() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if cookies already accepted
    const accepted = document.cookie.includes('sc_cookies_accepted=yes');
    if (!accepted) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    // Set cookie for 1 year
    const d = new Date();
    d.setTime(d.getTime() + 365 * 24 * 60 * 60 * 1000);
    document.cookie = `sc_cookies_accepted=yes; expires=${d.toUTCString()}; path=/; SameSite=Lax`;
    setShowBanner(false);
  };

  const handleManage = () => {
    window.location.href = '/contact#cookie-settings';
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f8fafc', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      {/* Navigation */}
      <Navigation />

      {/* Page Header */}
      <header
        className="border-b"
        style={{
          background: 'linear-gradient(90deg, rgba(37,99,235,0.06), transparent)',
          borderColor: 'rgba(15,23,42,0.04)',
          padding: '120px 18px 36px 18px'
        }}
      >
        <div className="max-w-[980px] mx-auto px-4">
          <div className="flex items-center gap-3">
            <div
              className="w-[52px] h-[52px] rounded-[10px] flex items-center justify-center text-white font-bold text-lg"
              style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}
            >
              SC
            </div>
            <div>
              <h1 className="text-2xl md:text-[28px] font-bold text-[#0f172a] mb-1">Cookie Policy</h1>
              <p className="text-[#6b7280] text-sm md:text-base">
                This Cookie Policy explains how <strong>Smart Chat</strong> uses cookies and similar technologies on{' '}
                <Link href="/" className="text-[#2563eb] hover:underline no-underline">
                  smart-chat.vercel.app
                </Link>.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[980px] mx-auto px-4 py-7 w-full">
        <article
          className="bg-white rounded-xl p-6 md:p-9"
          style={{
            boxShadow: '0 6px 18px rgba(2,6,23,0.06)',
            border: '1px solid rgba(2,6,23,0.04)'
          }}
        >
          {/* Section 1 */}
          <section className="mb-5">
            <h2 className="text-xl font-semibold text-[#0f172a] mb-3">1. What are cookies?</h2>
            <p className="text-[#6b7280] leading-relaxed">
              Cookies are small text files placed on your device (computer, smartphone, or other) when you visit a website.
              They help websites remember information about your visit, which can make your next visit easier and the site more useful.
            </p>
          </section>

          {/* Section 2 */}
          <section className="mb-5">
            <h2 className="text-xl font-semibold text-[#0f172a] mb-3">2. Which cookies do we use?</h2>
            <p className="text-[#6b7280] leading-relaxed mb-3">We use the following types of cookies:</p>
            <ul className="list-disc pl-5 text-[#6b7280] space-y-2">
              <li><strong className="text-[#0f172a]">Strictly necessary:</strong> Required for basic site functionality (e.g., session, authentication). These cannot be turned off in our systems.</li>
              <li><strong className="text-[#0f172a]">Performance & analytics:</strong> Help us understand how visitors interact with the site (page views, error reporting, performance). Example: Google Analytics cookies.</li>
              <li><strong className="text-[#0f172a]">Functional:</strong> Remember user choices (language, preferences) to improve your experience.</li>
              <li><strong className="text-[#0f172a]">Advertising & targeting:</strong> Used to deliver relevant advertisements and limit ad frequency. These may be set by third parties.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="mb-5">
            <h2 className="text-xl font-semibold text-[#0f172a] mb-3">3. Third-party cookies</h2>
            <p className="text-[#6b7280] leading-relaxed">
              We may allow third-party services (such as analytics or advertising providers) to set cookies on our site.
              These services have their own cookie policies and may use the data they collect in accordance with their terms.
            </p>
          </section>

          {/* Section 4 */}
          <section className="mb-5">
            <h2 className="text-xl font-semibold text-[#0f172a] mb-3">4. How long do cookies last?</h2>
            <p className="text-[#6b7280] leading-relaxed">
              Some cookies expire when you close your browser (session cookies). Others remain on your device for a set period (persistent cookies).
              The lifetime depends on the cookie — typically from a few minutes to up to 2 years for certain advertising cookies.
            </p>
          </section>

          {/* Section 5 */}
          <section className="mb-5">
            <h2 className="text-xl font-semibold text-[#0f172a] mb-3">5. How to control or delete cookies</h2>
            <p className="text-[#6b7280] leading-relaxed mb-3">
              You can control cookies through your browser settings. You may delete cookies, block cookies, or receive warnings before a cookie is stored.
              Note that blocking or deleting cookies may cause some parts of the site to stop working correctly.
            </p>
            <p className="text-[#6b7280] leading-relaxed mb-2">Common browser cookie settings:</p>
            <ul className="list-disc pl-5 text-[#6b7280] space-y-1">
              <li>Chrome: Settings → Privacy and security → Cookies and other site data</li>
              <li>Firefox: Options → Privacy & Security → Cookies and Site Data</li>
              <li>Edge: Settings → Cookies and site permissions</li>
              <li>Safari: Preferences → Privacy</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="mb-5">
            <h2 className="text-xl font-semibold text-[#0f172a] mb-3">6. Your choices</h2>
            <p className="text-[#6b7280] leading-relaxed">
              When you first visit the site, a cookie banner allows you to accept or decline non-essential cookies.
              You can change your consent at any time by clearing cookies or using the controls in this page (or the browser settings).
            </p>
          </section>

          {/* Section 7 */}
          <section className="mb-5">
            <h2 className="text-xl font-semibold text-[#0f172a] mb-3">7. Changes to this policy</h2>
            <p className="text-[#6b7280] leading-relaxed">
              We may update this Cookie Policy from time to time. The "Last updated" date at the top of this page indicates when the policy was last revised.
            </p>
          </section>

          {/* Section 8 */}
          <section className="mb-0">
            <h2 className="text-xl font-semibold text-[#0f172a] mb-3">8. Contact us</h2>
            <p className="text-[#6b7280] leading-relaxed">
              If you have questions about our cookie practices, contact us at{' '}
              <a href="mailto:hello@smartchat.com" className="text-[#2563eb] hover:underline no-underline">
                hello@smartchat.com
              </a>{' '}
              or visit our{' '}
              <Link href="/contact" className="text-[#2563eb] hover:underline no-underline">
                Contact page
              </Link>.
            </p>
          </section>
        </article>
      </main>

      {/* Cookie Banner */}
      {showBanner && (
        <div
          className="fixed left-4 right-4 bottom-4 md:left-[18px] md:right-[18px] md:bottom-[18px] p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center gap-3"
          style={{
            background: 'linear-gradient(90deg, #fff, #fbfdff)',
            boxShadow: '0 10px 30px rgba(2,6,23,0.12)',
            border: '1px solid rgba(2,6,23,0.06)'
          }}
          role="region"
          aria-live="polite"
        >
          <div className="flex-1">
            <p className="text-sm text-[#6b7280] m-0">
              <strong className="text-[#0f172a]">We use cookies</strong> — to personalize content, analyze traffic, and improve the site.
              By clicking "Accept", you consent to our use of non-essential cookies.
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={handleManage}
              className="px-4 py-2 rounded-lg font-semibold text-sm text-[#6b7280] bg-transparent border cursor-pointer hover:bg-gray-50 transition-colors"
              style={{ borderColor: 'rgba(2,6,23,0.06)' }}
            >
              Manage
            </button>
            <button
              onClick={handleAccept}
              className="px-4 py-2 rounded-lg font-semibold text-sm text-white bg-[#2563eb] border-0 cursor-pointer hover:bg-[#1d4ed8] transition-colors"
            >
              Accept
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}
