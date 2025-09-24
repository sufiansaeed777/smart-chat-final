'use client';

import React, { useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  phone: string;
  message: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  company?: string;
  phone?: string;
  message?: string;
}

const ContactPage = () => {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    phone: '',
    message: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');

  const validateField = (name: keyof FormData, value: string): string => {
    switch (name) {
      case 'firstName':
        if (!value.trim()) return 'First name is required';
        if (value.trim().length < 2) return 'First name must be at least 2 characters';
        return '';
      
      case 'lastName':
        if (!value.trim()) return 'Last name is required';
        if (value.trim().length < 2) return 'Last name must be at least 2 characters';
        return '';
      
      case 'email':
        if (!value.trim()) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Please enter a valid email address';
        return '';
      
      case 'company':
        if (value.trim() && value.trim().length < 2) return 'Company name must be at least 2 characters';
        return '';
      
      case 'phone':
        if (value.trim()) {
          const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
          if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
            return 'Please enter a valid phone number';
          }
        }
        return '';
      
      case 'message':
        if (!value.trim()) return 'Message is required';
        if (value.trim().length < 10) return 'Message must be at least 10 characters';
        if (value.trim().length > 1000) return 'Message must be less than 1000 characters';
        return '';
      
      default:
        return '';
    }
  };

  const handleInputChange = (name: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      const newError = validateField(name, value);
      if (newError !== errors[name]) {
        setErrors(prev => ({ ...prev, [name]: newError }));
      }
    }
  };

  const handleInputBlur = (name: keyof FormData) => {
    const error = validateField(name, formData[name]);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    Object.keys(formData).forEach((key) => {
      const fieldName = key as keyof FormData;
      const error = validateField(fieldName, formData[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Send form data to API
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSubmitStatus('success');
        setSubmitMessage(data.message);
        
        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          company: '',
          phone: '',
          message: ''
        });
        setErrors({});
      } else {
        setSubmitStatus('error');
        setSubmitMessage(data.error || 'Failed to send message. Please try again.');
      }
      
    } catch (error) {
      console.error('Contact form error:', error);
      setSubmitStatus('error');
      setSubmitMessage('An error occurred. Please try again or contact us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInputClassName = (fieldName: keyof FormData) => {
    const baseClasses = "flex h-10 w-full rounded-lg border px-3 py-2 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#6566F1] focus:border-transparent";
    
    if (errors[fieldName]) {
      return `${baseClasses} border-red-300 bg-red-50 text-red-900 placeholder:text-red-400`;
    }
    
    return `${baseClasses} border-gray-300 bg-white text-gray-900 placeholder:text-gray-500`;
  };

  const getTextareaClassName = () => {
    const baseClasses = "flex min-h-32 w-full rounded-lg border px-3 py-2 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#6566F1] focus:border-transparent resize-none";
    
    if (errors.message) {
      return `${baseClasses} border-red-300 bg-red-50 text-red-900 placeholder:text-red-400`;
    }
    
    return `${baseClasses} border-gray-300 bg-white text-gray-900 placeholder:text-gray-500`;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <Navigation />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-12 lg:px-16">
          <div className="max-w-4xl mx-auto">
            {/* Page header */}
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                Contact{" "}
                <span className="bg-gradient-to-r from-[#6566F1] to-purple-600 bg-clip-text text-transparent">
                  Sales
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Ready to transform your customer service with AI? Let&apos;s discuss how we can help your business grow.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-[#5A5BD8] hover:shadow-3xl transition-all duration-300 hover:-translate-y-2">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-2xl font-bold text-gray-900">Get in Touch</h2>
                </div>
                <div className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="firstName" className="text-sm font-bold text-gray-700">
                          First Name *
                        </label>
                        <input
                          id="firstName"
                          name="firstName"
                          required
                          value={formData.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          onBlur={() => handleInputBlur('firstName')}
                          placeholder="Enter your first name"
                          className={getInputClassName('firstName')}
                        />
                        {errors.firstName && (
                          <p className="text-sm text-red-600 flex items-center space-x-1">
                            <XCircle className="w-4 h-4" />
                            <span>{errors.firstName}</span>
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="lastName" className="text-sm font-bold text-gray-700">
                          Last Name *
                        </label>
                        <input
                          id="lastName"
                          name="lastName"
                          required
                          value={formData.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          onBlur={() => handleInputBlur('lastName')}
                          placeholder="Enter your last name"
                          className={getInputClassName('lastName')}
                        />
                        {errors.lastName && (
                          <p className="text-sm text-red-600 flex items-center space-x-1">
                            <XCircle className="w-4 h-4" />
                            <span>{errors.lastName}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-bold text-gray-700">
                        Email *
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        onBlur={() => handleInputBlur('email')}
                        placeholder="Enter your email address"
                        className={getInputClassName('email')}
                      />
                      {errors.email && (
                        <p className="text-sm text-red-600 flex items-center space-x-1">
                          <XCircle className="w-4 h-4" />
                          <span>{errors.email}</span>
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="company" className="text-sm font-bold text-gray-700">
                        Company
                      </label>
                      <input
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={(e) => handleInputChange('company', e.target.value)}
                        onBlur={() => handleInputBlur('company')}
                        placeholder="Enter your company name"
                        className={getInputClassName('company')}
                      />
                      {errors.company && (
                        <p className="text-sm text-red-600 flex items-center space-x-1">
                          <XCircle className="w-4 h-4" />
                          <span>{errors.company}</span>
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="phone" className="text-sm font-bold text-gray-700">
                        Phone Number
                      </label>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        onBlur={() => handleInputBlur('phone')}
                        placeholder="Enter your phone number"
                        className={getInputClassName('phone')}
                      />
                      {errors.phone && (
                        <p className="text-sm text-red-600 flex items-center space-x-1">
                          <XCircle className="w-4 h-4" />
                          <span>{errors.phone}</span>
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label htmlFor="message" className="text-sm font-bold text-gray-700">
                          Message *
                        </label>
                        <span className={`text-xs ${
                          formData.message.length > 1000 ? 'text-red-500' : 'text-gray-500'
                        }`}>
                          {formData.message.length}/1000
                        </span>
                      </div>
                      <textarea
                        id="message"
                        name="message"
                        required
                        value={formData.message}
                        onChange={(e) => handleInputChange('message', e.target.value)}
                        onBlur={() => handleInputBlur('message')}
                        placeholder="Tell us about your needs and how we can help..."
                        className={getTextareaClassName()}
                      />
                      {errors.message && (
                        <p className="text-sm text-red-600 flex items-center space-x-1">
                          <XCircle className="w-4 h-4" />
                          <span>{errors.message}</span>
                        </p>
                      )}
                    </div>
                    
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full h-12 bg-[#6566F1] text-white font-semibold rounded-2xl hover:bg-[#5A5BD9] disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <span>Send Message</span>
                      )}
                    </button>
                  </form>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-8">
                {/* Success/Error Message - Appears above Email Us on small screens, in right column on large screens */}
                {submitStatus !== 'idle' && (
                  <div className={`p-4 rounded-2xl border hover:shadow-[#5A5BD8] hover:shadow-3xl transition-all duration-300 hover:-translate-y-2 ${
                    submitStatus === 'success' 
                      ? 'bg-green-50 border-green-200 text-green-800' 
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                    <div className="flex items-center space-x-3">
                      {submitStatus === 'success' ? (
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                      )}
                      <p className="font-medium">{submitMessage}</p>
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-[#5A5BD8] hover:shadow-3xl transition-all duration-300 hover:-translate-y-2">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-[#6566F1]/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-[#6566F1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2 text-gray-900">Email Us</h3>
                      <p className="text-gray-600">
                        Send us an email and we&apos;ll respond within 24 hours.
                      </p>
                      <p className="text-[#6566F1] font-bold mt-2">
                        shared.affan@gmail.com
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-[#5A5BD8] hover:shadow-3xl transition-all duration-300 hover:-translate-y-2">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-[#6566F1]/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-[#6566F1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2 text-gray-900">Call Us</h3>
                      <p className="text-gray-600">
                        Speak directly with our sales team.
                      </p>
                      <p className="text-[#6566F1] font-bold mt-2">
                        +1 (555) 123-4567
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-[#5A5BD8] hover:shadow-3xl transition-all duration-300 hover:-translate-y-2">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-[#6566F1]/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-[#6566F1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2 text-gray-900">Visit Us</h3>
                      <p className="text-gray-600">
                        Our office is open Monday to Friday, 9 AM to 6 PM.
                      </p>
                      <p className="text-[#6566F1] font-bold mt-2">
                        123 Business Ave<br />
                        Suite 100<br />
                        San Francisco, CA 94105
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default ContactPage;
