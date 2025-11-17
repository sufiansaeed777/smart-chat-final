'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useReportIssue } from '@/contexts/ReportIssueContext';
import { X, AlertTriangle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ReportIssueModal = () => {
  const { data: session } = useSession();
  const { isOpen, closeModal } = useReportIssue();
  const [formData, setFormData] = useState({
    type: 'issue_report',
    message: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (!session?.user) {
        setError('You must be logged in to report an issue');
        setIsSubmitting(false);
        return;
      }

      // Get user info from session
      const response = await fetch('/api/chatbot/issues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: formData.type,
          userId: session.user.id || 'unknown',
          userEmail: session.user.email || '',
          userName: session.user.name || session.user.email || 'Unknown User',
          message: formData.message,
          priority: formData.priority
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit issue');
      }

      setSuccess(true);
      setFormData({ type: 'issue_report', message: '', priority: 'medium' });

      // Close modal after 2 seconds
      setTimeout(() => {
        setSuccess(false);
        closeModal();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit issue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({ type: 'issue_report', message: '', priority: 'medium' });
      setError('');
      setSuccess(false);
      closeModal();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#6566F1]/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-[#6566F1]" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Report an Issue</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Success Message */}
        {success ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Issue Reported Successfully!</h3>
            <p className="text-sm text-gray-600">
              Thank you for reporting this issue. Our team will review it and get back to you soon.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Body */}
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                Describe the issue you're experiencing and we'll help you resolve it as quickly as possible.
              </p>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Priority */}
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6566F1] focus:border-[#6566F1] text-gray-900"
                  disabled={isSubmitting}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              {/* Issue Description */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Issue Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Please describe the issue you're experiencing in detail..."
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6566F1] focus:border-[#6566F1] resize-none text-gray-900 placeholder-gray-500"
                  required
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Be as specific as possible to help us resolve your issue quickly
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !formData.message.trim()}
                className="bg-[#6566F1] hover:bg-[#5A5BD9] text-white px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Submitting...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Send className="w-4 h-4" />
                    <span>Submit Issue</span>
                  </div>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReportIssueModal;
