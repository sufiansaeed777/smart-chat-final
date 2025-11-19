'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const BillingPage: React.FC = () => {
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [invoiceFilter, setInvoiceFilter] = useState('all');
  const invoicesPerPage = 10;
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);

  const [currentPlan] = useState({
    name: 'Professional',
    price: 99,
    period: 'month',
    features: ['Up to 50 Users', 'Up to 10 Bots', 'Priority Support', 'Advanced Analytics'],
    usage: {
      users: 25,
      usersLimit: 50,
      bots: 5,
      botsLimit: 10,
      conversations: 1234,
      conversationsLimit: 5000,
      storage: 1.2,
      storageLimit: 50
    }
  });

  const [invoices] = useState([
    {
      id: 'INV-001',
      date: '2024-01-01',
      amount: 99,
      status: 'paid',
      description: 'Professional Plan - January 2024'
    },
    {
      id: 'INV-002',
      date: '2023-12-01',
      amount: 99,
      status: 'paid',
      description: 'Professional Plan - December 2023'
    },
    {
      id: 'INV-003',
      date: '2023-11-01',
      amount: 99,
      status: 'paid',
      description: 'Professional Plan - November 2023'
    },
    {
      id: 'INV-004',
      date: '2023-10-01',
      amount: 99,
      status: 'paid',
      description: 'Professional Plan - October 2023'
    },
    {
      id: 'INV-005',
      date: '2023-09-01',
      amount: 99,
      status: 'paid',
      description: 'Professional Plan - September 2023'
    },
    {
      id: 'INV-006',
      date: '2023-08-01',
      amount: 99,
      status: 'paid',
      description: 'Professional Plan - August 2023'
    },
    {
      id: 'INV-007',
      date: '2023-07-01',
      amount: 99,
      status: 'paid',
      description: 'Professional Plan - July 2023'
    },
    {
      id: 'INV-008',
      date: '2023-06-01',
      amount: 99,
      status: 'paid',
      description: 'Professional Plan - June 2023'
    },
    {
      id: 'INV-009',
      date: '2023-05-01',
      amount: 99,
      status: 'paid',
      description: 'Professional Plan - May 2023'
    },
    {
      id: 'INV-010',
      date: '2023-04-01',
      amount: 99,
      status: 'paid',
      description: 'Professional Plan - April 2023'
    },
    {
      id: 'INV-011',
      date: '2023-03-01',
      amount: 99,
      status: 'paid',
      description: 'Professional Plan - March 2023'
    },
    {
      id: 'INV-012',
      date: '2023-02-01',
      amount: 99,
      status: 'paid',
      description: 'Professional Plan - February 2023'
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'overdue':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  // Filter and sort invoices
  const getFilteredInvoices = () => {
    let filtered = [...invoices];

    switch (invoiceFilter) {
      case 'new':
        filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
      case 'old':
        filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        break;
      case 'high':
        filtered.sort((a, b) => b.amount - a.amount);
        break;
      case 'low':
        filtered.sort((a, b) => a.amount - b.amount);
        break;
      default:
        // Keep original order for 'all'
        break;
    }

    return filtered;
  };

  // Pagination logic
  const filteredInvoices = getFilteredInvoices();
  const totalPages = Math.ceil(filteredInvoices.length / invoicesPerPage);
  const startIndex = (currentPage - 1) * invoicesPerPage;
  const endIndex = startIndex + invoicesPerPage;
  const currentInvoices = filteredInvoices.slice(startIndex, endIndex);

  // Calculate usage percentages
  const usersPercentage = (currentPlan.usage.users / currentPlan.usage.usersLimit) * 100;
  const botsPercentage = (currentPlan.usage.bots / currentPlan.usage.botsLimit) * 100;
  const conversationsPercentage = (currentPlan.usage.conversations / currentPlan.usage.conversationsLimit) * 100;
  const storagePercentage = (currentPlan.usage.storage / currentPlan.usage.storageLimit) * 100;

  // Handle export billing data
  const handleExport = async () => {
    try {
      setIsExporting(true);

      const response = await fetch('/api/billing/export', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `billing-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('Failed to export billing data');
        alert('Failed to export billing data. Please try again.');
      }
    } catch (error) {
      console.error('Error exporting:', error);
      alert('An error occurred while exporting. Please try again.');
    } finally {
      setIsExporting(false);
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
          console.error('No checkout URL received');
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

  // Handle download invoice
  const handleDownloadInvoice = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/billing/invoice/${invoiceId}/download`, {
        method: 'GET',
      });

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
        console.error('Failed to download invoice');
        alert('Failed to download invoice. Please try again.');
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('An error occurred while downloading. Please try again.');
    }
  };

  // Handle view invoice
  const handleViewInvoice = (invoiceId: string) => {
    // Navigate to invoice detail page or open modal
    router.push(`/manager-dashboard/billing/invoice/${invoiceId}`);
  };

  // Handle update payment method
  const handleUpdatePaymentMethod = async () => {
    setIsUpdatingPayment(true);
    try {
      const response = await fetch('/api/billing/customer-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/manager-dashboard/billing`,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.url) {
          // Redirect to Stripe Customer Portal or payment update page
          window.location.href = data.url;
        } else {
          alert('Payment portal URL not available. Please try again.');
        }
      } else {
        if (data.needsSetup) {
          alert('Payment provider not configured.\n\nPlease contact support to update your payment method.\n\nEmail: support@smartchat.com');
        } else {
          alert(data.error || 'Failed to open payment portal. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error opening payment portal:', error);
      alert('An error occurred while opening the payment portal. Please try again.');
    } finally {
      setIsUpdatingPayment(false);
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
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center space-x-2 bg-white text-gray-700 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            <span>{isExporting ? 'Exporting...' : 'Export'}</span>
          </button>
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
        </div>
      </div>

      {/* Current Plan */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border-0">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Current Plan</h2>
          <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
            Active
          </span>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-[#6566F1] to-[#7F82F3] rounded-2xl flex items-center justify-center">
                <CreditCard className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{currentPlan.name}</h3>
                <p className="text-gray-600">${currentPlan.price}/{currentPlan.period}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {currentPlan.features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-xl">
            <h4 className="font-semibold text-gray-900 mb-3">Plan Details</h4>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Billing Cycle:</span>
                <span className="font-medium">Monthly</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Next Billing:</span>
                <span className="font-medium">Feb 1, 2024</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method:</span>
                <span className="font-medium">**** 4242</span>
              </div>
            </div>
            <button
              onClick={handleUpdatePaymentMethod}
              disabled={isUpdatingPayment}
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 text-[#6566F1] hover:text-[#5A5BD9] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdatingPayment ? 'Loading...' : 'Update Payment Method'}
            </button>
          </div>
        </div>
      </div>

      {/* Usage Statistics with Progress Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Users */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border-0 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-3xl font-bold text-gray-900">{currentPlan.usage.users}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{currentPlan.usage.users} of {currentPlan.usage.usersLimit} used</span>
              <span className="font-semibold text-blue-600">{usersPercentage.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${usersPercentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500">{currentPlan.usage.usersLimit - currentPlan.usage.users} users remaining</p>
          </div>
        </div>

        {/* Total Bots */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border-0 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Bots</p>
              <p className="text-3xl font-bold text-gray-900">{currentPlan.usage.bots}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <Bot className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{currentPlan.usage.bots} of {currentPlan.usage.botsLimit} used</span>
              <span className="font-semibold text-green-600">{botsPercentage.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-green-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${botsPercentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500">{currentPlan.usage.botsLimit - currentPlan.usage.bots} bots remaining</p>
          </div>
        </div>

        {/* Conversations */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border-0 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Conversations</p>
              <p className="text-3xl font-bold text-gray-900">{currentPlan.usage.conversations.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{currentPlan.usage.conversations.toLocaleString()} of {currentPlan.usage.conversationsLimit.toLocaleString()} used</span>
              <span className="font-semibold text-purple-600">{conversationsPercentage.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-purple-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${conversationsPercentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500">{(currentPlan.usage.conversationsLimit - currentPlan.usage.conversations).toLocaleString()} remaining</p>
          </div>
        </div>

        {/* Storage Used */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border-0 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Storage Used</p>
              <p className="text-3xl font-bold text-gray-900">{currentPlan.usage.storage} GB</p>
            </div>
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{currentPlan.usage.storage} GB of {currentPlan.usage.storageLimit} GB used</span>
              <span className="font-semibold text-orange-600">{storagePercentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-orange-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${storagePercentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500">{(currentPlan.usage.storageLimit - currentPlan.usage.storage).toFixed(1)} GB remaining</p>
          </div>
        </div>
      </div>

      {/* Billing History */}
      <div className="bg-white rounded-2xl shadow-sm border-0 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <FileText className="w-6 h-6 mr-2 text-[#6566F1]" />
                Billing History
              </h3>
              <p className="text-gray-600 mt-1">View and download your invoices</p>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={invoiceFilter}
                onChange={(e) => {
                  setInvoiceFilter(e.target.value);
                  setCurrentPage(1); // Reset to first page when filter changes
                }}
                className="px-4 py-2 border border-gray-300 rounded-xl focus:border-[#6566F1] focus:ring-[#6566F1] bg-white text-sm font-medium"
              >
                <option value="all">All Invoices</option>
                <option value="new">Newest First</option>
                <option value="old">Oldest First</option>
                <option value="high">High to Low</option>
                <option value="low">Low to High</option>
              </select>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Invoice
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {currentInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                        <FileText className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-gray-900">{invoice.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(invoice.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {invoice.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    ${invoice.amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full border flex items-center w-fit ${getStatusColor(invoice.status)}`}>
                      {getStatusIcon(invoice.status)}
                      <span className="ml-1 capitalize">{invoice.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDownloadInvoice(invoice.id)}
                        className="text-[#6566F1] hover:text-[#5A5BD9] p-2 rounded-lg hover:bg-[#6566F1]/10 transition-colors"
                        title="Download Invoice"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleViewInvoice(invoice.id)}
                        className="text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        title="View Invoice Details"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredInvoices.length)} of {filteredInvoices.length} invoices
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-[#6566F1] text-white'
                        : 'border border-gray-300 hover:bg-white text-gray-700'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default BillingPage;