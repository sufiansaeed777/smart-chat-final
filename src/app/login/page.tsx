'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import GoogleSignInButton from '@/components/GoogleSignInButton';

const LoginComponent = () => {
  const router = useRouter();
  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.email || !form.password) {
      setError('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    setError('');
    setMessage('');

    try {
      // First check if user is deactivated using direct API call
      const checkResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      });

      const checkData = await checkResponse.json();

      // Debug: Log the response for troubleshooting
      console.log('Login API response:', {
        status: checkResponse.status,
        ok: checkResponse.ok,
        error: checkData.error
      });

      if (!checkResponse.ok) {
        // Show specific error message for deactivated accounts
        if (checkData.error && checkData.error.includes('deactivated')) {
          setError('Your account has been deactivated. Please contact your administrator.');
        } else {
          setError(checkData.error || 'Invalid email or password');
        }
        return;
      }

      // If API login successful, use NextAuth signIn for session management
      const result = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error('Session creation failed');
      }

      if (result?.ok) {
        setMessage('Login successful!');
        setForm({
          email: '',
          password: '',
        });
        
        // Get the session to determine user role and redirect appropriately
        const session = await getSession();
        if (session?.user?.email) {
          // Get role from session
          const userRole = 'role' in session.user ? session.user.role : 'user';
          
          let redirectUrl = '/user-dashboard'; // default
          if (userRole === 'admin') {
            redirectUrl = '/admin-dashboard';
          } else if (userRole === 'manager') {
            redirectUrl = '/manager-dashboard';
          }
          
          setTimeout(() => {
            router.push(redirectUrl);
          }, 1500);
        }
      }
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
          <h3 className="text-2xl font-extrabold leading-none tracking-tight text-gray-900">Welcome Back</h3>
          <p className="text-sm font-medium text-gray-600">
            Sign in to your AI chatbot platform
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
            <div className={`mb-4 p-3 rounded-lg text-sm ${
              error.includes('deactivated') 
                ? 'bg-red-200 text-red-800 border border-red-300' 
                : 'bg-red-100 text-red-700'
            }`}>
              {error.includes('deactivated') && (
                <div className="flex items-center space-x-2 mb-1">
                  <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                  <span className="font-semibold">Account Deactivated</span>
                </div>
              )}
              {error}
            </div>
          )}

          {/* Google Sign In Button */}
          <div className="mb-6">
            <GoogleSignInButton text="Sign in with Google" />
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
                placeholder="Enter your password"
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
            
            {/* Submit Button */}
            <button 
              type="submit"
              disabled={loading}
              className="w-full h-10 text-white font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#6566F1', borderRadius: '10px' }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#5A5BD8')}
              onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#6566F1')}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
          
          {/* Bottom Link */}
          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">Don&apos;t have an account? </span>
            <Link
              href="/signup"
              className="hover:underline font-semibold"
              style={{ color: '#6566F1' }}
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginComponent;
