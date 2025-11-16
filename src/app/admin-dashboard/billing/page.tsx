'use client';

import React, { useState, useEffect } from 'react';
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
  XCircle,
  Mail,
  Phone
} from 'lucide-react';

const BillingPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });

  useEffect(() => {
    const loadBillingData = async () => {
      try {
        // Fetch analytics for usage stats
        const analyticsResponse = await fetch('/api/admin/analytics');
        if (analyticsResponse.ok) {
          const analyticsData = await analyticsResponse.json();
          setAnalytics(analyticsData);
        }

        // Fetch invoices
        const invoicesResponse = await fetch('/api/admin/billing/invoices');
        if (invoicesResponse.ok) {
          const invoicesData = await invoicesResponse.json();
          setInvoices(invoicesData.invoices || []);
        }

        // Fetch subscriptions
        const subscriptionsResponse = await fetch('/api/admin/billing/subscriptions');
        if (subscriptionsResponse.ok) {
          const subscriptionsData = await subscriptionsResponse.json();
          setSubscriptions(subscriptionsData.subscriptions || []);
        }
      } catch (error) {
        console.error('Error loading billing data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBillingData();
  }, []);

  // Calculate current plan from active subscriptions
  const activeSubscription = subscriptions.find(sub => sub.status === 'active');
  const currentPlan = activeSubscription ? {
    name: activeSubscription.planName || 'No Active Plan',
    price: activeSubscription.amount || 0,
    period: activeSubscription.billingCycle || 'month',
    features: ['Unlimited Users', 'Unlimited Bots', 'Priority Support', 'Advanced Analytics'],
    usage: {
      users: analytics?.overview?.totalUsers || 0,
      bots: analytics?.overview?.totalBots || 0,
      conversations: analytics?.overview?.totalConversations || 0,
      storage: 0
    }
  } : {
    name: 'No Active Plan',
    price: 0,
    period: 'month',
    features: [],
    usage: {
      users: analytics?.overview?.totalUsers || 0,
      bots: analytics?.overview?.totalBots || 0,
      conversations: analytics?.overview?.totalConversations || 0,
      storage: 0
    }
  };

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

  const handleViewInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    setShowInvoiceModal(true);
  };

  const handleDownloadInvoice = (invoice: any) => {
    // Create a simple invoice text file
    const invoiceContent = `
INVOICE
=======

Invoice Number: ${invoice.invoiceNumber || invoice.id}
Date: ${new Date(invoice.createdAt).toLocaleDateString()}
Status: ${invoice.status.toUpperCase()}

${invoice.managerName ? `Manager: ${invoice.managerName}\nEmail: ${invoice.managerEmail}\n` : ''}
Description: ${invoice.planName || invoice.notes || 'Subscription Payment'}

AMOUNT BREAKDOWN
================
Subtotal:  $${(invoice.amount || 0).toFixed(2)}
Tax:       $${(invoice.tax || 0).toFixed(2)}
Discount:  -$${(invoice.discount || 0).toFixed(2)}
-----------------------------------
Total:     $${(invoice.total || invoice.amount || 0).toFixed(2)}

${invoice.paidAt ? `Paid On: ${new Date(invoice.paidAt).toLocaleDateString()}` : `Due Date: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}`}

${invoice.notes ? `Notes: ${invoice.notes}` : ''}

Thank you for your business!
    `.trim();

    // Create and download the file
    const blob = new Blob([invoiceContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${invoice.invoiceNumber || invoice.id}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleUpdatePaymentMethod = () => {
    setShowPaymentModal(true);
  };

  const handleSavePaymentMethod = () => {
    // Validate payment method
    if (!paymentMethod.cardNumber || !paymentMethod.expiryDate || !paymentMethod.cvv || !paymentMethod.cardholderName) {
      alert('Please fill in all payment method fields');
      return;
    }

    // In a real app, this would integrate with Stripe or another payment processor
    alert('Payment method updated successfully! In production, this would integrate with your payment processor.');
    setShowPaymentModal(false);
    setPaymentMethod({
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: ''
    });
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border-0">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
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
          <button
            onClick={() => alert('Export billing data feature coming soon.')}
            className="flex items-center space-x-2 bg-white text-gray-700 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <Download className="w-5 h-5" />
            <span>Export</span>
          </button>
          <button
            onClick={() => alert('Upgrade plan feature coming soon. Please contact support for plan upgrades.')}
            className="flex items-center space-x-2 bg-[#6566F1] text-white px-4 py-2 rounded-xl hover:bg-[#5A5BD9] transition-colors shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>Upgrade Plan</span>
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
            <div className="space-y-2 text-sm">
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
          </div>
        </div>
      </div>

      {/* Usage Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border-0 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-3xl font-bold text-gray-900">{currentPlan.usage.users.toLocaleString()}</p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <TrendingUp className="w-4 h-4 mr-1" />
                +12% this month
              </p>
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
              <p className="text-3xl font-bold text-gray-900">{currentPlan.usage.bots}</p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <TrendingUp className="w-4 h-4 mr-1" />
                +8% this month
              </p>
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
              <p className="text-3xl font-bold text-gray-900">{currentPlan.usage.conversations.toLocaleString()}</p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <TrendingUp className="w-4 h-4 mr-1" />
                +15% this month
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border-0 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Storage Used</p>
              <p className="text-3xl font-bold text-gray-900">{currentPlan.usage.storage} GB</p>
              <p className="text-sm text-blue-600 flex items-center mt-1">
                <DollarSign className="w-4 h-4 mr-1" />
                2.4% of limit
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Billing History */}
      <div className="bg-white rounded-2xl shadow-sm border-0 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <FileText className="w-6 h-6 mr-2 text-[#6566F1]" />
            Billing History
          </h3>
          <p className="text-gray-600 mt-1">View and download your invoices</p>
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
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No invoices found
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                          <FileText className="w-5 h-5 text-gray-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900">{invoice.invoiceNumber || invoice.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(invoice.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {invoice.planName || invoice.notes || 'Subscription Payment'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      ${(invoice.total || invoice.amount || 0).toFixed(2)}
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
                          onClick={() => handleDownloadInvoice(invoice)}
                          className="text-[#6566F1] hover:text-[#5A5BD9] p-2 rounded-lg hover:bg-[#6566F1]/10 transition-colors"
                          title="Download Invoice"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleViewInvoice(invoice)}
                          className="text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                          title="View Invoice Details"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Method */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border-0">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <CreditCard className="w-6 h-6 mr-2 text-[#6566F1]" />
          Payment Method
        </h3>
        
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-8 bg-blue-600 rounded flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Visa ending in 4242</p>
              <p className="text-sm text-gray-600">Expires 12/25</p>
            </div>
          </div>
          <button
            onClick={handleUpdatePaymentMethod}
            className="text-[#6566F1] hover:text-[#5A5BD9] font-medium"
          >
            Update
          </button>
        </div>
      </div>

      {/* Invoice Details Modal */}
      {showInvoiceModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5 border-b border-gray-200 pb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Invoice Details</h2>
                <p className="text-sm text-gray-600 mt-1">Invoice #{selectedInvoice.invoiceNumber || selectedInvoice.id}</p>
              </div>
              <button
                onClick={() => {
                  setShowInvoiceModal(false);
                  setSelectedInvoice(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Invoice Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    selectedInvoice.status === 'paid' ? 'bg-green-100' :
                    selectedInvoice.status === 'pending' ? 'bg-yellow-100' : 'bg-red-100'
                  }`}>
                    {getStatusIcon(selectedInvoice.status)}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="text-lg font-semibold text-gray-900 capitalize">{selectedInvoice.status}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="text-2xl font-bold text-gray-900">${(selectedInvoice.total || selectedInvoice.amount || 0).toFixed(2)}</p>
                </div>
              </div>

              {/* Customer Information */}
              {selectedInvoice.managerName && (
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Customer Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-900">{selectedInvoice.managerName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{selectedInvoice.managerEmail}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Invoice Information */}
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Invoice Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 mb-1">Invoice Number</p>
                    <p className="text-gray-900 font-medium">{selectedInvoice.invoiceNumber || selectedInvoice.id}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Issue Date</p>
                    <p className="text-gray-900 font-medium">{new Date(selectedInvoice.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Due Date</p>
                    <p className="text-gray-900 font-medium">
                      {selectedInvoice.dueDate ? new Date(selectedInvoice.dueDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  {selectedInvoice.paidAt && (
                    <div>
                      <p className="text-gray-600 mb-1">Paid On</p>
                      <p className="text-gray-900 font-medium">{new Date(selectedInvoice.paidAt).toLocaleDateString()}</p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <p className="text-gray-600 mb-1">Description</p>
                    <p className="text-gray-900 font-medium">{selectedInvoice.planName || selectedInvoice.notes || 'Subscription Payment'}</p>
                  </div>
                </div>
              </div>

              {/* Amount Breakdown */}
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Amount Breakdown</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900 font-medium">${(selectedInvoice.amount || 0).toFixed(2)}</span>
                  </div>
                  {selectedInvoice.tax > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax</span>
                      <span className="text-gray-900 font-medium">${(selectedInvoice.tax || 0).toFixed(2)}</span>
                    </div>
                  )}
                  {selectedInvoice.discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Discount</span>
                      <span className="text-green-600 font-medium">-${(selectedInvoice.discount || 0).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-gray-900 font-semibold">Total</span>
                      <span className="text-gray-900 font-bold text-lg">${(selectedInvoice.total || selectedInvoice.amount || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedInvoice.notes && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Notes</h3>
                  <p className="text-sm text-gray-700">{selectedInvoice.notes}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-6 mt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowInvoiceModal(false);
                  setSelectedInvoice(null);
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleDownloadInvoice(selectedInvoice);
                  setShowInvoiceModal(false);
                  setSelectedInvoice(null);
                }}
                className="px-6 py-2 bg-[#6566F1] text-white rounded-xl hover:bg-[#5A5BD9] transition-colors flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Method Update Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900">Update Payment Method</h2>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentMethod({
                    cardNumber: '',
                    expiryDate: '',
                    cvv: '',
                    cardholderName: ''
                  });
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Cardholder Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={paymentMethod.cardholderName}
                  onChange={(e) => setPaymentMethod({ ...paymentMethod, cardholderName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#6566F1] focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Card Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={paymentMethod.cardNumber}
                  onChange={(e) => {
                    // Format card number with spaces
                    const value = e.target.value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
                    setPaymentMethod({ ...paymentMethod, cardNumber: value });
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#6566F1] focus:border-transparent"
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Expiry Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={paymentMethod.expiryDate}
                    onChange={(e) => {
                      // Format as MM/YY
                      const value = e.target.value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2');
                      setPaymentMethod({ ...paymentMethod, expiryDate: value });
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#6566F1] focus:border-transparent"
                    placeholder="MM/YY"
                    maxLength={5}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    CVV <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={paymentMethod.cvv}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setPaymentMethod({ ...paymentMethod, cvv: value });
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#6566F1] focus:border-transparent"
                    placeholder="123"
                    maxLength={4}
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-xs text-blue-800">
                  <strong>Note:</strong> In production, this would integrate with Stripe or another secure payment processor.
                  Your card information would be encrypted and handled securely.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-6 mt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentMethod({
                    cardNumber: '',
                    expiryDate: '',
                    cvv: '',
                    cardholderName: ''
                  });
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePaymentMethod}
                className="px-6 py-2 bg-[#6566F1] text-white rounded-xl hover:bg-[#5A5BD9] transition-colors"
              >
                Save Payment Method
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingPage;
