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
  Package
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

const BillingPage: React.FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch subscription data on mount
  useEffect(() => {
    fetchSubscriptionData();
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

  // Handle upgrade plan
  const handleUpgrade = async () => {
    try {
      setIsUpgrading(true);

      const enterprisePlan = {
        planType: 'enterprise',
        amount: 299,
        currency: 'USD',
        description: 'Enterprise Plan - Unlimited Users & Bots',
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
        starter: 'Starter Plan - Up to 20 Users & 5 Bots',
        professional: 'Professional Plan - Up to 50 Users & 10 Bots',
        enterprise: 'Enterprise Plan - Unlimited Users & Bots'
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

  // No subscription state - Show pricing plans
  if (!subscriptionData?.hasSubscription) {
    return (
      <div className="p-6 min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
            <p className="text-xl text-gray-600">Get started with a subscription to unlock all features</p>
          </div>

          {/* Pricing Plans */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* Starter Plan */}
            <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-8 hover:shadow-lg transition-all">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Starter</h3>
                <div className="flex items-baseline mb-4">
                  <span className="text-4xl font-bold text-gray-900">$29</span>
                  <span className="text-gray-600 ml-2">/month</span>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Up to 20 Users</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Up to 5 Bots</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Email Support</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">1,000 Conversations</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => handleSubscribe('starter', 29)}
                disabled={isUpgrading}
                className="w-full py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium disabled:opacity-50"
              >
                {isUpgrading ? 'Processing...' : 'Get Started'}
              </button>
            </div>

            {/* Professional Plan */}
            <div className="bg-white rounded-2xl shadow-lg border-2 border-[#6566F1] p-8 hover:shadow-xl transition-all relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-[#6566F1] text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </span>
              </div>
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Professional</h3>
                <div className="flex items-baseline mb-4">
                  <span className="text-4xl font-bold text-gray-900">$99</span>
                  <span className="text-gray-600 ml-2">/month</span>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Up to 50 Users</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Up to 10 Bots</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Priority Support</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Advanced Analytics</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => handleSubscribe('professional', 99)}
                disabled={isUpgrading}
                className="w-full py-3 bg-[#6566F1] text-white rounded-xl hover:bg-[#5A5BD9] transition-colors font-medium disabled:opacity-50"
              >
                {isUpgrading ? 'Processing...' : 'Get Started'}
              </button>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-8 hover:shadow-lg transition-all">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Enterprise</h3>
                <div className="flex items-baseline mb-4">
                  <span className="text-4xl font-bold text-gray-900">$299</span>
                  <span className="text-gray-600 ml-2">/month</span>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Unlimited Users</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Unlimited Bots</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">24/7 Support</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Custom Integrations</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => handleSubscribe('enterprise', 299)}
                disabled={isUpgrading}
                className="w-full py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium disabled:opacity-50"
              >
                {isUpgrading ? 'Processing...' : 'Get Started'}
              </button>
            </div>
          </div>

          {/* Current Plan (Free) */}
          {subscriptionData && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                    <Package className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Current Plan: {subscriptionData.plan.name}</h3>
                    <p className="text-gray-600">Limited features. Upgrade to unlock full potential.</p>
                  </div>
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
            <h4 className="font-semibold text-gray-900 mb-3">Manage Subscription</h4>
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
            <button
              onClick={handleUpdatePaymentMethod}
              disabled={isUpdatingPayment}
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 text-[#6566F1] hover:text-[#5A5BD9] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdatingPayment ? 'Loading...' : 'Manage Subscription'}
            </button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Update payment method, view invoices, or cancel subscription
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
    </div>
  );
};

export default BillingPage;
