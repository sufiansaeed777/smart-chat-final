'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Menu, X, ChevronDown } from 'lucide-react';

const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Product", href: "/product" },
    { label: "Pricing", href: "/pricing" },
    { label: "Contact", href: "/contact" },
  ];

  const isActive = (href: string) => pathname === href;

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  // Function to get dashboard URL based on user role
  const getDashboardUrl = () => {
    // For now, we'll use a default since we don't have role info in session
    // This will be improved when we add role to the session
    return '/user-dashboard'; // Default fallback
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled || pathname !== "/"
          ? "bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-lg"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">AI</span>
            </div>
            <span className="ml-2 text-xl font-bold text-gray-900">
              ChatBot Pro
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {navItems.map((item) => {
              if (item.label === "Product") {
                return (
                  <div
                    key={item.label}
                    className="relative"
                    onMouseEnter={() => setIsProductDropdownOpen(true)}
                    onMouseLeave={() => setIsProductDropdownOpen(false)}
                  >
                    <Link
                      href={item.href}
                      className={`transition-all duration-200 hover:scale-110 flex items-center space-x-1 ${
                        isActive(item.href)
                          ? "text-blue-600 font-medium"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <span>{item.label}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${isProductDropdownOpen ? 'rotate-180' : ''}`} />
                    </Link>
                    {isProductDropdownOpen && (
                      <div className="absolute top-full left-0 mt-2 w-56 bg-gray-900 rounded-lg shadow-xl py-2 z-50">
                        <div className="px-4 py-2 border-b border-gray-800">
                          <h3 className="text-white font-bold text-sm">Product</h3>
                        </div>
                        <Link
                          href="/product#features"
                          className="block px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                          onClick={() => setIsProductDropdownOpen(false)}
                        >
                          Features
                        </Link>
                        <Link
                          href="/product#how-it-works"
                          className="block px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                          onClick={() => setIsProductDropdownOpen(false)}
                        >
                          How It Works
                        </Link>
                        <Link
                          href="/product#testimonials"
                          className="block px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                          onClick={() => setIsProductDropdownOpen(false)}
                        >
                          Customer Stories
                        </Link>
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`transition-all duration-200 hover:scale-110 ${
                    isActive(item.href)
                      ? "text-blue-600 font-medium"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center space-x-4">
            {session ? (
              <>
                <button
                  onClick={handleSignOut}
                  className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg transition-colors"
                >
                  Sign Out
                </button>
                <Link 
                  href={getDashboardUrl()} 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-xl hover:shadow-lg transition-all duration-200"
                >
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg transition-colors">
                  Login
                </Link>
                <Link href="/signup" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-xl hover:shadow-lg transition-all duration-200">
                  Get Started Free
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-600 hover:text-gray-900 p-2"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`lg:hidden fixed inset-0 bg-white shadow-2xl z-40 transition-transform duration-300 ease-in-out overflow-hidden ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`} style={{ height: '100dvh' }}>
          <div className="flex flex-col h-full bg-white">
            {/* Mobile Menu Header with Logo and Close Button */}
            <div className="flex items-center justify-between p-6 bg-white border-b border-gray-200">
              {/* Logo and Brand */}
              <Link href="/" className="flex items-center" onClick={() => setIsMobileMenuOpen(false)}>
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">AI</span>
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900">
                  ChatBot Pro
                </span>
              </Link>
              
              {/* Close Button */}
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Navigation Links */}
            <div className="flex-1 px-6 py-8 bg-white">
              <div className="space-y-6">
                {navItems.map((item) => {
                  if (item.label === "Product") {
                    return (
                      <div key={item.label}>
                        <button
                          onClick={() => setIsProductDropdownOpen(!isProductDropdownOpen)}
                          className={`block text-2xl font-medium transition-all duration-200 w-full text-left py-3 hover:scale-105 flex items-center justify-between ${
                            isActive(item.href)
                              ? "text-blue-600"
                              : "text-gray-600 hover:text-gray-900"
                          }`}
                        >
                          <span>{item.label}</span>
                          <ChevronDown className={`w-5 h-5 transition-transform ${isProductDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isProductDropdownOpen && (
                          <div className="pl-4 mt-2 space-y-3 border-l-2 border-gray-200">
                            <Link
                              href="/product#features"
                              onClick={() => {
                                setIsMobileMenuOpen(false);
                                setIsProductDropdownOpen(false);
                              }}
                              className="block text-lg text-gray-600 hover:text-blue-600 py-2 transition-colors"
                            >
                              Features
                            </Link>
                            <Link
                              href="/product#how-it-works"
                              onClick={() => {
                                setIsMobileMenuOpen(false);
                                setIsProductDropdownOpen(false);
                              }}
                              className="block text-lg text-gray-600 hover:text-blue-600 py-2 transition-colors"
                            >
                              How It Works
                            </Link>
                            <Link
                              href="/product#testimonials"
                              onClick={() => {
                                setIsMobileMenuOpen(false);
                                setIsProductDropdownOpen(false);
                              }}
                              className="block text-lg text-gray-600 hover:text-blue-600 py-2 transition-colors"
                            >
                              Customer Stories
                            </Link>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`block text-2xl font-medium transition-all duration-200 w-full text-left py-3 hover:scale-105 ${
                        isActive(item.href)
                          ? "text-blue-600"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
            
            {/* CTA Buttons - Fixed at bottom */}
            <div className="px-6 py-8 border-t border-gray-200 bg-gray-100">
              <div className="space-y-4">
                {session ? (
                  <>
                    <button 
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleSignOut();
                      }}
                      className="w-full text-gray-600 hover:text-gray-900 px-6 py-4 rounded-lg transition-colors text-left text-lg font-medium border border-gray-300 hover:bg-gray-200 bg-white block"
                    >
                      Sign Out
                    </button>
                    <Link 
                      href={getDashboardUrl()} 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-xl hover:shadow-lg transition-all duration-200 text-lg font-medium block"
                    >
                      Dashboard
                    </Link>
                  </>
                ) : (
                  <>
                    <Link 
                      href="/login" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full text-gray-600 hover:text-gray-900 px-6 py-4 rounded-lg transition-colors text-left text-lg font-medium border border-gray-300 hover:bg-gray-200 bg-white block"
                    >
                      Login
                    </Link>
                    <Link 
                      href="/signup" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-xl hover:shadow-lg transition-all duration-200 text-lg font-medium block"
                    >
                      Get Started Free
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Backdrop */}
        <div 
          className={`lg:hidden fixed inset-0 bg-black/40 z-30 transition-opacity duration-300 ${
            isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setIsMobileMenuOpen(false)}
        />
      </div>
    </nav>
  );
};

export default Navigation;
