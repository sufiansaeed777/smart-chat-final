'use client';

import { useState } from 'react';
import Link from 'next/link';
import GoogleSignInButton from '@/components/GoogleSignInButton';

// Standalone Signup Component for Next.js
const SignupComponent = () => {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (form.password !== form.confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    
    if (!form.acceptTerms) {
      setError('Please accept the terms and conditions');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          firstName: form.firstName,
          lastName: form.lastName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      setMessage(data.message);
      setForm({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        acceptTerms: false
      });
      
      // Don't redirect - user needs to verify email first
      // The message will show them to check their email
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Something went wrong";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setForm({ ...form, [field]: value });
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4" style={{
      fontFamily: 'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", Segoe UI Symbol, "Noto Color Emoji"',
      fontFeatureSettings: 'normal',
      fontVariationSettings: 'normal'
    }}>
      {/* Logo */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">
                ChatBot Pro
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* Card */}
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Card Header */}
        <div className="flex flex-col space-y-1.5 p-6 text-center">
          <h3 className="text-2xl font-extrabold leading-none tracking-tight text-gray-900">Create Account</h3>
          <p className="text-sm font-medium text-gray-600">
            Sign up to get started with your AI chatbot platform
          </p>
        </div>
        
        {/* Card Content */}
        <div className="p-6 pt-0">
          {/* Success Message */}
          {message && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">
              {message}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Google Sign In Button */}
          <div className="mb-6">
            <GoogleSignInButton text="Sign up with Google" />
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* First Name and Last Name */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label 
                  htmlFor="firstName"
                  className="text-sm font-semibold leading-none text-gray-900"
                >
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  value={form.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  required
                  className="flex h-10 w-full border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ 
                    borderRadius: '10px', 
                    color: '#111827',
                    '--tw-ring-color': '#6566F1'
                  } as React.CSSProperties}
                />
              </div>
              <div className="space-y-2">
                <label 
                  htmlFor="lastName"
                  className="text-sm font-semibold leading-none text-gray-900"
                >
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  value={form.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  required
                  className="flex h-10 w-full border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ 
                    borderRadius: '10px', 
                    color: '#111827',
                    '--tw-ring-color': '#6566F1'
                  } as React.CSSProperties}
                />
              </div>
            </div>
            
            {/* Email */}
            <div className="space-y-2">
              <label 
                htmlFor="email"
                className="text-sm font-semibold leading-none text-gray-900"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={form.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                className="flex h-10 w-full border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ 
                  borderRadius: '10px', 
                  color: '#111827',
                  '--tw-ring-color': '#6566F1'
                } as React.CSSProperties}
              />
            </div>
            
            {/* Password */}
            <div className="space-y-2">
              <label 
                htmlFor="password"
                className="text-sm font-semibold leading-none text-gray-900"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Create a strong password"
                value={form.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
                className="flex h-10 w-full border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ 
                  borderRadius: '10px', 
                  color: '#111827',
                  '--tw-ring-color': '#6566F1'
                } as React.CSSProperties}
              />
            </div>
            
            {/* Confirm Password */}
            <div className="space-y-2">
              <label 
                htmlFor="confirmPassword"
                className="text-sm font-semibold leading-none text-gray-900"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={form.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value )}
                required
                className="flex h-10 w-full border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ 
                  borderRadius: '10px', 
                  color: '#111827',
                  '--tw-ring-color': '#6566F1'
                } as React.CSSProperties}
              />
            </div>
            
            {/* Terms Checkbox */}
            <div className="flex items-start space-x-3">
              <button
                type="button"
                role="checkbox"
                aria-checked={form.acceptTerms}
                onClick={() => setForm({ ...form, acceptTerms: !form.acceptTerms })}
                className={`mt-1 h-4 w-4 shrink-0 border-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors ${
                  form.acceptTerms 
                    ? 'text-white' 
                    : 'bg-white border-gray-300'
                }`}
                style={form.acceptTerms ? { backgroundColor: '#6566F1', borderColor: '#6566F1', borderRadius: '10px' } : { borderRadius: '10px' }}
              >
                {form.acceptTerms && (
                  <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z"/>
                  </svg>
                )}
              </button>
              <label 
                htmlFor="terms" 
                className="text-sm font-medium text-gray-600 leading-5"
              >
                I agree to the{' '}
                <a href="/terms" className="hover:underline font-semibold" style={{ color: '#6566F1' }}>
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy" className="hover:underline font-semibold" style={{ color: '#6566F1' }}>
                  Privacy Policy
                </a>
              </label>
            </div>
            
            {/* Submit Button */}
            <button 
              type="submit"
              disabled={loading}
              className="w-full h-10 text-white font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#6566F1', borderRadius: '10px' }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#5A5BD8')}
              onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#6566F1')}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
          
          {/* Bottom Link */}
          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">Already have an account? </span>
            <Link
              href="/login"
              className="hover:underline font-semibold"
              style={{ color: '#6566F1' }}
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupComponent;
