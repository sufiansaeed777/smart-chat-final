'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  CreditCard,
  Download,
  Calendar,
  TrendingUp,
  DollarSign,
  Users,
  Bot,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  Clock,
  FileText,
  Plus,
  ExternalLink,
  Loader2
} from 'lucide-react';

interface Subscription {
  id: string;
  status: string;
  planName: string;
  planPrice: number;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId?: string;
}

interface UsageStats {
  users: number;
  bots: number;
  conversations: number;
  documents: number;
}

const BillingPage: React.FC = () => {
  const { data: session } = useSession();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetchSubscriptionData();
      fetchUsageStats();
    }
  }, [session]);

  const fetchSubscriptionData = async () => {
    try {
      const response = await fetch('/api/billing/subscription-status');
      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsageStats = async () => {
    try {
      const response = await fetch('/api/manager/stats/usage');
      if (response.ok) {
        const data = await response.json();
        setUsageStats(data);
      }
    } catch (error) {
      console.error('Error fetching usage stats:', error);
    }
  };

  const handleManageBilling = async () => {
    if (!session?.user) return;

    setPortalLoading(true);
    try {
      const response = await fetch('/api/billing/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: (session.user as any).id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Redirect to Stripe Customer Portal
        window.location.href = data.url;
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to open billing portal');
      }
    } catch (error) {
      console.error('Error opening billing portal:', error);
      alert('Failed to open billing portal');
    } finally {
      setPortalLoading(false);
    }
  };

  const handleUpgradePlan = async () => {
    // Redirect to pricing page or open checkout
    window.location.href = '/pricing';
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'trialing':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'past_due':
      case 'unpaid':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'canceled':
      case 'incomplete':
      case 'incomplete_expired':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'trialing':
        return <CheckCircle className="w-4 h-4" />;
      case 'past_due':
      case 'unpaid':
        return <Clock className="w-4 h-4" />;
      case 'canceled':
      case 'incomplete':
      case 'incomplete_expired':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#6566F1] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading billing information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing & Usage</h1>
          <p className="text-gray-600 mt-2">Manage your subscription and view usage statistics</p>
        </div>
        <div className="flex items-center space-x-3">
          {subscription?.stripeCustomerId && (
            <button
              onClick={handleManageBilling}
              disabled={portalLoading}
              className="flex items-center space-x-2 bg-white text-gray-700 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {portalLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ExternalLink className="w-5 h-5" />
              )}
              <span>Manage Billing</span>
            </button>
          )}
          <button
            onClick={handleUpgradePlan}
            className="flex items-center space-x-2 bg-[#6566F1] text-white px-4 py-2 rounded-xl hover:bg-[#5A5BD9] transition-colors shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>Upgrade Plan</span>
          </button>
        </div>
      </div>

      {/* Current Plan */}
      {subscription ? (
        <div className="bg-white p-6 rounded-2xl shadow-sm border-0">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Current Plan</h2>
            <span className={`px-3 py-1 text-sm font-medium rounded-full flex items-center gap-1 ${getStatusColor(subscription.status)}`}>
              {getStatusIcon(subscription.status)}
              <span className="capitalize">{subscription.status}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-[#6566F1] to-[#7F82F3] rounded-2xl flex items-center justify-center">
                  <CreditCard className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{subscription.planName || 'Free Plan'}</h3>
                  <p className="text-gray-600">
                    {subscription.planPrice ? `$${subscription.planPrice}/month` : 'Free'}
                  </p>
                </div>
              </div>

              {subscription.cancelAtPeriodEnd && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-medium">Your subscription will be canceled on {formatDate(subscription.currentPeriodEnd)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-xl">
              <h4 className="font-semibold text-gray-900 mb-3">Plan Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium capitalize">{subscription.status}</span>
                </div>
                {subscription.currentPeriodEnd && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {subscription.cancelAtPeriodEnd ? 'Expires:' : 'Next Billing:'}
                    </span>
                    <span className="font-medium">{formatDate(subscription.currentPeriodEnd)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-2xl shadow-sm border-0">
          <div className="text-center py-8">
            <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Active Subscription</h3>
            <p className="text-gray-600 mb-4">Subscribe to a plan to unlock all features</p>
            <button
              onClick={handleUpgradePlan}
              className="bg-[#6566F1] text-white px-6 py-3 rounded-xl hover:bg-[#5A5BD9] transition-colors"
            >
              View Plans
            </button>
          </div>
        </div>
      )}

      {/* Usage Statistics */}
      {usageStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border-0 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Team Members</p>
                <p className="text-3xl font-bold text-gray-900">{usageStats.users || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border-0 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Bots</p>
                <p className="text-3xl font-bold text-gray-900">{usageStats.bots || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <Bot className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border-0 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversations</p>
                <p className="text-3xl font-bold text-gray-900">{usageStats.conversations?.toLocaleString() || 0}</p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border-0 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Documents</p>
                <p className="text-3xl font-bold text-gray-900">{usageStats.documents || 0}</p>
              </div>
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stripe Customer Portal Info */}
      {subscription?.stripeCustomerId && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Manage Your Subscription</h3>
              <p className="text-gray-600 mb-4">
                Click "Manage Billing" to access the Stripe Customer Portal where you can:
              </p>
              <ul className="space-y-2 text-sm text-gray-600 mb-4">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Update payment methods
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  View and download invoices
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Update billing information
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Cancel or change your subscription
                </li>
              </ul>
              <button
                onClick={handleManageBilling}
                disabled={portalLoading}
                className="flex items-center gap-2 bg-[#6566F1] text-white px-4 py-2 rounded-lg hover:bg-[#5A5BD9] transition-colors disabled:opacity-50"
              >
                {portalLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ExternalLink className="w-5 h-5" />
                )}
                <span>Open Billing Portal</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingPage;
