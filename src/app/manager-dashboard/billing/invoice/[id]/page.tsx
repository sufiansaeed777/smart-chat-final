'use client';

import React, { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Download,
  FileText,
  Calendar,
  DollarSign,
  CreditCard,
  CheckCircle,
  Building,
  Mail,
  Phone,
  MapPin,
  Printer
} from 'lucide-react';

interface InvoiceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const invoiceId = unwrappedParams.id;

  const [invoice] = useState({
    id: invoiceId,
    number: invoiceId,
    date: '2024-01-01',
    dueDate: '2024-01-15',
    amount: 99,
    tax: 9.90,
    subtotal: 89.10,
    status: 'paid',
    description: 'Professional Plan - January 2024',
    billingPeriod: 'January 1, 2024 - January 31, 2024',
    paymentMethod: '**** 4242',
    transactionId: 'txn_' + invoiceId,
    company: {
      name: 'Smart Chat Inc.',
      address: '123 AI Street',
      city: 'San Francisco',
      state: 'CA',
      zip: '94102',
      country: 'United States',
      email: 'billing@smartchat.com',
      phone: '+1 (555) 123-4567'
    },
    customer: {
      name: 'Your Company',
      email: 'customer@example.com',
      address: '456 Business Ave',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      country: 'United States'
    },
    items: [
      {
        description: 'Professional Plan Subscription',
        quantity: 1,
        rate: 89.10,
        amount: 89.10
      }
    ]
  });

  const handleDownload = async () => {
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
      alert('An error occurred while downloading. Please try again.');
    }
  };

  const handlePrint = () => {
    window.print();
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header Actions */}
        <div className="flex items-center justify-between mb-6 no-print">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Billing</span>
          </button>
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <Printer className="w-5 h-5" />
              <span>Print</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center space-x-2 px-4 py-2 bg-[#6566F1] text-white rounded-xl hover:bg-[#5A5BD9] transition-colors"
            >
              <Download className="w-5 h-5" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        {/* Invoice */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {/* Invoice Header */}
          <div className="flex items-start justify-between mb-8 pb-8 border-b border-gray-200">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#6566F1] to-[#7F82F3] rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">INVOICE</h1>
                  <p className="text-gray-600">{invoice.number}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Date: {new Date(invoice.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Due Date: {new Date(invoice.dueDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${getStatusColor(invoice.status)}`}>
                <CheckCircle className="w-4 h-4 mr-1" />
                {invoice.status.toUpperCase()}
              </span>
              <div className="mt-4 text-sm text-gray-600">
                <p>Transaction ID:</p>
                <p className="font-mono text-gray-900">{invoice.transactionId}</p>
              </div>
            </div>
          </div>

          {/* Company & Customer Info */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">From</h3>
              <div className="space-y-2">
                <p className="font-semibold text-gray-900">{invoice.company.name}</p>
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p>{invoice.company.address}</p>
                      <p>{invoice.company.city}, {invoice.company.state} {invoice.company.zip}</p>
                      <p>{invoice.company.country}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4" />
                    <p>{invoice.company.email}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4" />
                    <p>{invoice.company.phone}</p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Bill To</h3>
              <div className="space-y-2">
                <p className="font-semibold text-gray-900">{invoice.customer.name}</p>
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p>{invoice.customer.address}</p>
                      <p>{invoice.customer.city}, {invoice.customer.state} {invoice.customer.zip}</p>
                      <p>{invoice.customer.country}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4" />
                    <p>{invoice.customer.email}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Items */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Invoice Details</h3>
            <div className="overflow-hidden border border-gray-200 rounded-xl">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Quantity</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Rate</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {invoice.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 text-sm text-gray-900">{item.description}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 text-right">{item.quantity}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 text-right">${item.rate.toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">${item.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-80 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold text-gray-900">${invoice.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax (10%):</span>
                <span className="font-semibold text-gray-900">${invoice.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-3 border-t border-gray-200">
                <span className="text-gray-900">Total:</span>
                <span className="text-[#6566F1]">${invoice.amount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-gray-50 rounded-xl p-6 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase">Payment Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Billing Period:</p>
                <p className="font-medium text-gray-900">{invoice.billingPeriod}</p>
              </div>
              <div>
                <p className="text-gray-600">Payment Method:</p>
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-4 h-4 text-gray-600" />
                  <p className="font-medium text-gray-900">{invoice.paymentMethod}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
            <p>Thank you for your business!</p>
            <p className="mt-2">If you have any questions about this invoice, please contact {invoice.company.email}</p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          /* Hide sidebar, navigation, and all fixed elements */
          nav,
          aside,
          header[class*="fixed"],
          [class*="sidebar"],
          [class*="Sidebar"],
          [role="navigation"],
          .no-print {
            display: none !important;
            visibility: hidden !important;
          }

          /* Reset page styles for printing */
          html,
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }

          /* Remove all left margins from body children */
          body > * {
            margin-left: 0 !important;
          }

          /* Remove page wrapper styling */
          .min-h-screen {
            min-height: auto !important;
            background: white !important;
            padding: 0 !important;
            margin-left: 0 !important;
          }

          /* Center and style invoice for print */
          .max-w-5xl {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
          }

          /* Remove shadows and borders for clean print */
          .shadow-sm,
          .shadow-lg {
            box-shadow: none !important;
          }

          /* Ensure backgrounds print correctly */
          .bg-gray-50,
          .bg-gray-100 {
            background: #f9fafb !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .bg-gradient-to-br {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Keep status badge colors */
          .bg-green-100,
          .bg-yellow-100,
          .bg-red-100 {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Page breaks */
          .invoice-section {
            page-break-inside: avoid;
          }

          /* Fit invoice on one page */
          @page {
            size: auto;
            margin: 15mm;
          }
        }
      `}</style>
    </div>
  );
}
