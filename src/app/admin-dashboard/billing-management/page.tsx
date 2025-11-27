'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  CreditCard,
  DollarSign,
  Users,
  Calendar,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Edit,
  X
} from 'lucide-react';

interface Subscription {
  id: string;
  managerId: string;
  managerName: string;
  managerEmail: string;
  planName: string;
  status: 'active' | 'inactive' | 'cancelled' | 'past_due';
  amount: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  startDate: string;
  endDate: string;
  nextBillingDate: string;
  usersCount: number;
  botsCount: number;
  createdAt: string;
  updatedAt: string;
}

const AVAILABLE_PLANS = [
  { id: 'free', name: 'Free', description: 'Basic features, limited usage' },
  { id: 'starter', name: 'Starter', description: '$29/month - For small teams' },
  { id: 'professional', name: 'Professional', description: '$79/month - For growing businesses' },
  { id: 'enterprise', name: 'Enterprise', description: '$199/month - For large organizations' }
];

const SUBSCRIPTION_STATUSES = [
  { id: 'active', name: 'Active' },
  { id: 'past_due', name: 'Past Due' },
  { id: 'cancelled', name: 'Cancelled' },
  { id: 'suspended', name: 'Suspended' },
  { id: 'trialing', name: 'Trialing' }
];

export default function AdminBillingManagement() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');

  // Plan assignment modal state
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Subscription | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  const openPlanModal = (subscription: Subscription) => {
    setSelectedUser(subscription);
    setSelectedPlan(subscription.planName.toLowerCase());
    setSelectedStatus(subscription.status);
    setShowPlanModal(true);
  };

  const closePlanModal = () => {
    setShowPlanModal(false);
    setSelectedUser(null);
    setSelectedPlan('');
    setSelectedStatus('');
  };

  const handleUpdatePlan = async () => {
    if (!selectedUser || !selectedPlan) return;

    setIsUpdating(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.managerId,
          updates: {
            subscriptionPlan: selectedPlan,
            subscriptionStatus: selectedStatus || 'active'
          }
        })
      });

      if (response.ok) {
        // Update local state
        setSubscriptions(prev => prev.map(sub =>
          sub.id === selectedUser.id
            ? { ...sub, planName: selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1), status: selectedStatus as any }
            : sub
        ));
        closePlanModal();
        alert('Plan updated successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to update plan: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating plan:', error);
      alert('An error occurred while updating the plan');
    } finally {
      setIsUpdating(false);
    }
  };

  // Fetch subscriptions from API
  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const response = await fetch('/api/admin/billing/subscriptions');
        if (response.ok) {
          const data = await response.json();
          setSubscriptions(data.subscriptions || []);
        } else {
          console.error('Failed to fetch subscriptions');
          // Fallback to empty array
          setSubscriptions([]);
        }
      } catch (error) {
        console.error('Error fetching subscriptions:', error);
        // Fallback to empty array
        setSubscriptions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptions();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4" />;
      case 'inactive':
        return <XCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      case 'past_due':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <XCircle className="h-4 w-4" />;
    }
  };

  const filteredSubscriptions = subscriptions.filter(subscription => {
    const matchesSearch = subscription.managerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subscription.managerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subscription.planName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || subscription.status === statusFilter;
    const matchesPlan = planFilter === 'all' || subscription.planName.toLowerCase() === planFilter.toLowerCase();
    
    return matchesSearch && matchesStatus && matchesPlan;
  });

  const totalRevenue = subscriptions.reduce((sum, sub) => {
    if (sub.status === 'active') {
      return sum + (sub.billingCycle === 'yearly' ? sub.amount : sub.amount * 12);
    }
    return sum;
  }, 0);

  const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active').length;
  const pastDueSubscriptions = subscriptions.filter(sub => sub.status === 'past_due').length;

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Billing Management</h1>
          <p className="text-gray-600">Manage manager subscriptions and billing</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6566F1]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Billing Management</h1>
        <p className="text-gray-600">Manage manager subscriptions and billing</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-700">${totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-green-600">Annual recurring</p>
              </div>
              <div className="h-12 w-12 bg-green-500 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Active Subscriptions</p>
                <p className="text-2xl font-bold text-blue-700">{activeSubscriptions}</p>
                <p className="text-xs text-blue-600">Currently active</p>
              </div>
              <div className="h-12 w-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Past Due</p>
                <p className="text-2xl font-bold text-yellow-700">{pastDueSubscriptions}</p>
                <p className="text-xs text-yellow-600">Need attention</p>
              </div>
              <div className="h-12 w-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Total Managers</p>
                <p className="text-2xl font-bold text-purple-700">{subscriptions.length}</p>
                <p className="text-xs text-purple-600">All subscriptions</p>
              </div>
              <div className="h-12 w-12 bg-purple-500 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search managers, emails, or plans..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#6566F1] focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="cancelled">Cancelled</option>
                <option value="past_due">Past Due</option>
              </select>
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#6566F1] focus:border-transparent"
              >
                <option value="all">All Plans</option>
                <option value="basic">Basic</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Manager Subscriptions</CardTitle>
          <CardDescription>
            Manage and monitor all manager subscription plans
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Manager</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Plan</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Billing</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Usage</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Next Billing</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubscriptions.map((subscription) => (
                  <tr key={subscription.id} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{subscription.managerName}</p>
                        <p className="text-sm text-gray-500">{subscription.managerEmail}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {subscription.planName}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <Badge className={`${getStatusColor(subscription.status)} flex items-center gap-1 w-fit`}>
                        {getStatusIcon(subscription.status)}
                        {subscription.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          ${subscription.amount}/{subscription.billingCycle === 'monthly' ? 'mo' : 'yr'}
                        </p>
                        <p className="text-sm text-gray-500">{subscription.currency}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant="outline" className="capitalize">
                        {subscription.billingCycle}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm">
                        <p className="text-gray-900">{subscription.usersCount} users</p>
                        <p className="text-gray-500">{subscription.botsCount} bots</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm">
                        <p className="text-gray-900">
                          {new Date(subscription.nextBillingDate).toLocaleDateString()}
                        </p>
                        <p className="text-gray-500">
                          {Math.ceil((new Date(subscription.nextBillingDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openPlanModal(subscription)}
                          className="flex items-center gap-1"
                        >
                          <Edit className="h-3 w-3" />
                          Change Plan
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredSubscriptions.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No subscriptions found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plan Assignment Modal */}
      {showPlanModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Assign Plan</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedUser.managerName} ({selectedUser.managerEmail})
                </p>
              </div>
              <button
                onClick={closePlanModal}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Plan Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Select Plan
                </label>
                <div className="space-y-2">
                  {AVAILABLE_PLANS.map((plan) => (
                    <label
                      key={plan.id}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedPlan === plan.id
                          ? 'border-[#6566F1] bg-[#6566F1]/5 ring-2 ring-[#6566F1]/20'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="plan"
                        value={plan.id}
                        checked={selectedPlan === plan.id}
                        onChange={(e) => setSelectedPlan(e.target.value)}
                        className="sr-only"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{plan.name}</p>
                        <p className="text-sm text-gray-500">{plan.description}</p>
                      </div>
                      {selectedPlan === plan.id && (
                        <CheckCircle className="w-5 h-5 text-[#6566F1]" />
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* Status Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Subscription Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6566F1] focus:border-transparent"
                >
                  {SUBSCRIPTION_STATUSES.map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Warning */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> This will manually override the user&apos;s subscription.
                  This bypasses Stripe billing - use for special cases only.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <Button
                onClick={handleUpdatePlan}
                disabled={isUpdating || !selectedPlan}
                className="flex-1 bg-[#6566F1] hover:bg-[#5A5BD9] text-white"
              >
                {isUpdating ? 'Updating...' : 'Update Plan'}
              </Button>
              <Button
                onClick={closePlanModal}
                variant="outline"
                disabled={isUpdating}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
