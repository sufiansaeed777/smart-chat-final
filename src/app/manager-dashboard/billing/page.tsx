'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CreditCard,
  TrendingUp,
  Users,
  Bot,
  MessageSquare,
  CheckCircle,
  Loader2,
  Plus,
  AlertCircle,
  Package,
  X,
  Download
} from 'lucide-react';

interface SubscriptionData {
  hasSubscription: boolean;
  plan: {
    name: string;
    price: number;
    period: string;
    features: string[];
    status: string;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
  };
  usage: {
    users: number;
    usersLimit: number;
    bots: number;
    botsLimit: number;
    conversations: number;
    conversationsLimit: number;
    storage: number;
    storageLimit: number;
  };
}

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  date: string;
  planName: string;
  amount: number;
  status: string;
  dueDate: string | null;
  paidAt: string | null;
}

const BillingPage: React.FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null);

  // Fetch subscription data and invoices on mount
  useEffect(() => {
    fetchSubscriptionData();
    fetchInvoices();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/billing/subscription');

      if (!response.ok) {
        throw new Error('Failed to fetch subscription data');
      }

      const data = await response.json();
      setSubscriptionData(data);
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setError('Failed to load billing information. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      const response = await fetch('/api/billing/invoices');

      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices || []);
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
    }
  };

  // Handle upgrade plan
  const handleUpgrade = async () => {
    try {
      setIsUpgrading(true);

      const enterprisePlan = {
        planType: 'enterprise',
        amount: 199,
        currency: 'USD',
        description: 'Enterprise Plan - Up to 100 Users & 50 Bots',
      };

      const response = await fetch('/api/payment/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(enterprisePlan),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          alert('Failed to create checkout session. Please try again.');
        }
      } else {
        const error = await response.json();
        console.error('Failed to create checkout session:', error);
        alert('Failed to upgrade plan. Please try again.');
      }
    } catch (error) {
      console.error('Error upgrading plan:', error);
      alert('An error occurred while upgrading. Please try again.');
    } finally {
      setIsUpgrading(false);
    }
  };

  // Handle subscribe (for users without subscription)
  const handleSubscribe = async (planType: string, price: number) => {
    try {
      setIsUpgrading(true);

      const planDescriptions: Record<string, string> = {
        starter: 'Starter Plan - Up to 5 Users & 3 Bots',
        professional: 'Professional Plan - Up to 20 Users & 10 Bots',
        enterprise: 'Enterprise Plan - Up to 100 Users & 50 Bots'
      };

      const planData = {
        planType,
        amount: price,
        currency: 'USD',
        description: planDescriptions[planType] || 'Subscription Plan',
      };

      const response = await fetch('/api/payment/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(planData),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          alert('Failed to create checkout session. Please try again.');
        }
      } else {
        const error = await response.json();
        console.error('Failed to create checkout session:', error);
        alert('Failed to start subscription. Please try again.');
      }
    } catch (error) {
      console.error('Error subscribing:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsUpgrading(false);
    }
  };

  // Handle download invoice
  const handleDownloadInvoice = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/billing/invoice/${invoiceId}/download`);

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${invoiceId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to download invoice. Please try again.');
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('An error occurred while downloading the invoice.');
    }
  };

  // Handle update payment method - use existing Stripe Customer Portal
  const handleUpdatePaymentMethod = async () => {
    setIsUpdatingPayment(true);
    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to open payment portal. Please try again.');
      }
    } catch (error) {
      console.error('Error opening payment portal:', error);
      alert('An error occurred while opening the payment portal. Please try again.');
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#6566F1] mx-auto mb-4" />
          <p className="text-gray-600">Loading billing information...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6 min-h-screen bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 max-w-2xl mx-auto mt-12">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-red-900 mb-1">Error Loading Billing Data</h3>
              <p className="text-red-700 mb-4">{error}</p>
              <button
                onClick={fetchSubscriptionData}
                className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get current plan name for comparison
  const currentPlanName = subscriptionData?.plan?.name?.toLowerCase() || 'free';

  // Check if user is on Free or Starter plan (show upgrade options)
  const showUpgradePlans = !subscriptionData?.hasSubscription || currentPlanName === 'starter';

  // No subscription or Starter plan - Show pricing plans with Current Plan indicator
  if (showUpgradePlans) {
    const usage = subscriptionData?.usage;

    // Calculate usage percentages for free/starter users
    const usersPercentage = usage ? (usage.users / usage.usersLimit) * 100 : 0;
    const botsPercentage = usage ? (usage.bots / usage.botsLimit) * 100 : 0;
    const conversationsPercentage = usage ? (usage.conversations / usage.conversationsLimit) * 100 : 0;

    return (
      <div className="p-6 min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Billing & Usage</h1>
            <p className="text-gray-600 mt-2">Manage your subscription and view usage statistics</p>
          </div>

          {/* Current Plan Usage Stats */}
          {usage && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Active Users */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border-0 hover:shadow-lg transition-all duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Active Users</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {usage.users}
                      <span className="text-base text-gray-500 font-normal"> / {usage.usersLimit}</span>
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(usersPercentage, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">{usersPercentage.toFixed(1)}% used</p>
              </div>

              {/* Active Bots */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border-0 hover:shadow-lg transition-all duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Active Bots</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {usage.bots}
                      <span className="text-base text-gray-500 font-normal"> / {usage.botsLimit}</span>
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(botsPercentage, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">{botsPercentage.toFixed(1)}% used</p>
              </div>

              {/* Conversations */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border-0 hover:shadow-lg transition-all duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Conversations</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {usage.conversations}
                      <span className="text-base text-gray-500 font-normal"> / {usage.conversationsLimit}</span>
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(conversationsPercentage, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">{conversationsPercentage.toFixed(1)}% used</p>
              </div>
            </div>
          )}

          {/* Upgrade Section Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {currentPlanName === 'starter' ? 'Upgrade Your Plan' : 'Choose Your Plan'}
            </h2>
            <p className="text-gray-600">
              {currentPlanName === 'starter'
                ? 'Upgrade to unlock more features and higher limits'
                : 'Select a plan that fits your needs'}
            </p>
          </div>

          {/* Pricing Plans */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* Free Plan */}
            <div className={`bg-white rounded-2xl shadow-sm p-6 hover:shadow-lg transition-all relative ${currentPlanName === 'free' ? 'border-2 border-[#6566F1]' : 'border-2 border-gray-200'}`}>
              {currentPlanName === 'free' && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-[#6566F1] text-white px-3 py-1 rounded-full text-xs font-semibold">
                    Current Plan
                  </span>
                </div>
              )}
              <div className="mb-6 mt-2">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Free</h3>
                <div className="flex items-baseline mb-4">
                  <span className="text-3xl font-bold text-gray-900">$0</span>
                  <span className="text-gray-600 ml-2">/month</span>
                </div>
                <ul className="space-y-2">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-700">Up to 1 User</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-700">Up to 1 Bot</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-700">Basic Support</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-700">100 Conversations/month</span>
                  </li>
                </ul>
              </div>
              {currentPlanName === 'free' ? (
                <button
                  disabled
                  className="w-full py-3 bg-gray-100 text-gray-500 rounded-xl font-medium cursor-not-allowed"
                >
                  Current Plan
                </button>
              ) : (
                <button
                  disabled
                  className="w-full py-3 bg-gray-200 text-gray-500 rounded-xl font-medium cursor-not-allowed"
                >
                  Downgrade
                </button>
              )}
            </div>

            {/* Starter Plan */}
            <div className={`bg-white rounded-2xl shadow-sm p-6 hover:shadow-lg transition-all relative ${currentPlanName === 'starter' ? 'border-2 border-[#6566F1]' : 'border-2 border-gray-200'}`}>
              {currentPlanName === 'starter' && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-[#6566F1] text-white px-3 py-1 rounded-full text-xs font-semibold">
                    Current Plan
                  </span>
                </div>
              )}
              <div className="mb-6 mt-2">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Starter</h3>
                <div className="flex items-baseline mb-4">
                  <span className="text-3xl font-bold text-gray-900">$29</span>
                  <span className="text-gray-600 ml-2">/month</span>
                </div>
                <ul className="space-y-2">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-700">Up to 5 Users</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-700">Up to 3 Bots</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-700">Email Support</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-700">1,000 Conversations/month</span>
                  </li>
                </ul>
              </div>
              {currentPlanName === 'starter' ? (
                <button
                  disabled
                  className="w-full py-3 bg-gray-100 text-gray-500 rounded-xl font-medium cursor-not-allowed"
                >
                  Current Plan
                </button>
              ) : (
                <button
                  onClick={() => handleSubscribe('starter', 29)}
                  disabled={isUpgrading}
                  className="w-full py-3 bg-[#6566F1] text-white rounded-xl hover:bg-[#5A5BD9] transition-colors font-medium disabled:opacity-50"
                >
                  {isUpgrading ? 'Processing...' : 'Get Starter'}
                </button>
              )}
            </div>

            {/* Professional Plan */}
            <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6 hover:shadow-xl transition-all relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                  Most Popular
                </span>
              </div>
              <div className="mb-6 mt-2">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Professional</h3>
                <div className="flex items-baseline mb-4">
                  <span className="text-3xl font-bold text-gray-900">$79</span>
                  <span className="text-gray-600 ml-2">/month</span>
                </div>
                <ul className="space-y-2">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-700">Up to 20 Users</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-700">Up to 10 Bots</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-700">Priority Support</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-700">5,000 Conversations/month</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => handleSubscribe('professional', 79)}
                disabled={isUpgrading}
                className="w-full py-3 bg-[#6566F1] text-white rounded-xl hover:bg-[#5A5BD9] transition-colors font-medium disabled:opacity-50"
              >
                {isUpgrading ? 'Processing...' : 'Get Pro'}
              </button>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-6 hover:shadow-lg transition-all">
              <div className="mb-6 mt-2">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Enterprise</h3>
                <div className="flex items-baseline mb-4">
                  <span className="text-3xl font-bold text-gray-900">$199</span>
                  <span className="text-gray-600 ml-2">/month</span>
                </div>
                <ul className="space-y-2">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-700">Up to 100 Users</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-700">Up to 50 Bots</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-700">24/7 Support</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-700">50,000 Conversations/month</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => handleSubscribe('enterprise', 199)}
                disabled={isUpgrading}
                className="w-full py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium disabled:opacity-50"
              >
                {isUpgrading ? 'Processing...' : 'Get Enterprise'}
              </button>
            </div>
          </div>

          {/* Upgrade Notice for users approaching limits */}
          {usage && (usersPercentage > 80 || botsPercentage > 80 || conversationsPercentage > 80) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-yellow-900 mb-1">Approaching Usage Limits</h3>
                  <p className="text-yellow-700">
                    You're close to reaching your plan limits. Consider upgrading to avoid service interruption.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Has subscription - Show billing dashboard
  const { plan, usage } = subscriptionData;

  // Calculate usage percentages
  const usersPercentage = (usage.users / usage.usersLimit) * 100;
  const botsPercentage = (usage.bots / usage.botsLimit) * 100;
  const conversationsPercentage = (usage.conversations / usage.conversationsLimit) * 100;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing & Usage</h1>
          <p className="text-gray-600 mt-2">Manage your subscription and view usage statistics</p>
        </div>
        <div className="flex items-center space-x-3">
          {plan.name !== 'Enterprise' && (
            <button
              onClick={handleUpgrade}
              disabled={isUpgrading}
              className="flex items-center space-x-2 bg-[#6566F1] text-white px-4 py-2 rounded-xl hover:bg-[#5A5BD9] transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpgrading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Plus className="w-5 h-5" />
              )}
              <span>{isUpgrading ? 'Processing...' : 'Upgrade Plan'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Current Plan */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border-0">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Current Plan</h2>
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(plan.status)}`}>
            {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-[#6566F1] to-[#7F82F3] rounded-2xl flex items-center justify-center">
                <CreditCard className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                <p className="text-gray-600">${plan.price}/{plan.period}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {plan.features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl">
            <h4 className="font-semibold text-gray-900 mb-3">Subscription Settings</h4>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Billing Cycle:</span>
                <span className="font-medium capitalize">{plan.period}ly</span>
              </div>
              {plan.stripeCustomerId && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Customer ID:</span>
                  <span className="font-medium text-xs">{plan.stripeCustomerId.slice(-8)}</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              {plan.name !== 'Enterprise' && (
                <button
                  onClick={handleUpgrade}
                  disabled={isUpgrading}
                  className="w-full px-4 py-2 bg-[#6566F1] text-white rounded-xl hover:bg-[#5A5BD9] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isUpgrading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <TrendingUp className="w-4 h-4" />
                  )}
                  <span>{isUpgrading ? 'Processing...' : 'Upgrade Plan'}</span>
                </button>
              )}
              <button
                onClick={handleUpdatePaymentMethod}
                disabled={isUpdatingPayment}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 text-gray-700 hover:text-gray-900 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdatingPayment ? 'Loading...' : 'Update Method'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Update payment method or view invoices
            </p>
          </div>
        </div>
      </div>

      {/* Usage Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Active Users */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border-0 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active Users</p>
              <p className="text-3xl font-bold text-gray-900">
                {usage.users}
                <span className="text-base text-gray-500 font-normal"> / {usage.usersLimit}</span>
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(usersPercentage, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">{usersPercentage.toFixed(1)}% used</p>
        </div>

        {/* Active Bots */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border-0 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active Bots</p>
              <p className="text-3xl font-bold text-gray-900">
                {usage.bots}
                <span className="text-base text-gray-500 font-normal"> / {usage.botsLimit}</span>
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(botsPercentage, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">{botsPercentage.toFixed(1)}% used</p>
        </div>

        {/* Conversations */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border-0 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Conversations</p>
              <p className="text-3xl font-bold text-gray-900">
                {usage.conversations}
                <span className="text-base text-gray-500 font-normal"> / {usage.conversationsLimit}</span>
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(conversationsPercentage, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">{conversationsPercentage.toFixed(1)}% used</p>
        </div>
      </div>

      {/* Billing History / Invoices */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border-0">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Billing History</h2>
          <span className="text-sm text-gray-600">Recent invoices and payments</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Invoice</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoices.length > 0 ? (
                invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">#{invoice.invoiceNumber}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(invoice.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{invoice.planName}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">${invoice.amount.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                        invoice.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-left">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setShowInvoiceModal(true);
                          }}
                          className="text-[#6566F1] hover:text-[#5A5BD9] text-sm font-medium transition-colors"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDownloadInvoice(invoice.id)}
                          className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
                          title="Download Invoice PDF"
                        >
                          <Download className="w-4 h-4" />
                          <span>Export</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No invoices found. Invoices will appear here when you have billing activity.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upgrade Notice */}
      {(usersPercentage > 80 || botsPercentage > 80 || conversationsPercentage > 80) && plan.name !== 'Enterprise' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-yellow-900 mb-1">Approaching Usage Limits</h3>
              <p className="text-yellow-700 mb-3">
                You're close to reaching your plan limits. Consider upgrading to avoid service interruption.
              </p>
              <button
                onClick={handleUpgrade}
                className="px-4 py-2 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 transition-colors font-medium"
              >
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoiceModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Invoice</h2>
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Invoice #</span>
                <span className="font-semibold text-gray-900">#{selectedInvoice.invoiceNumber}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">Date</span>
                <span className="font-semibold text-gray-900">{new Date(selectedInvoice.date).toLocaleDateString()}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">Plan</span>
                <span className="font-semibold text-gray-900">{selectedInvoice.planName}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">Amount</span>
                <span className="font-bold text-2xl text-gray-900">${selectedInvoice.amount.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status</span>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                  selectedInvoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                  selectedInvoice.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {selectedInvoice.status.toUpperCase()}
                </span>
              </div>

              {selectedInvoice.dueDate && selectedInvoice.status !== 'paid' && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Due Date</span>
                  <span className="font-semibold text-gray-900">{new Date(selectedInvoice.dueDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 pb-6 pt-2 space-y-4">
              <button
                onClick={() => handleDownloadInvoice(selectedInvoice.id)}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-[#6566F1] text-white rounded-xl hover:bg-[#5A5BD9] font-medium transition-colors"
              >
                <Download className="w-5 h-5" />
                <span>Download Invoice PDF</span>
              </button>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-gray-700 font-medium mb-1">Thank you for your business!</p>
                <p className="text-sm text-gray-500">Questions? Contact us at billing@smartchat.com</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingPage;
