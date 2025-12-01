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
  X,
  UserPlus,
  RefreshCw
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

interface UserForAssignment {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: string;
  subscriptionPlan: string;
  subscriptionStatus: string | null;
  messagesUsedThisMonth: number;
  isActive: boolean;
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

  // Plan assignment modal state (for existing subscriptions)
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Subscription | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<string>('monthly');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [planNotes, setPlanNotes] = useState<string>('');
  const [resetUsage, setResetUsage] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // New user assignment modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserForAssignment[]>([]);
  const [selectedUserForAssignment, setSelectedUserForAssignment] = useState<UserForAssignment | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const openPlanModal = (subscription: Subscription) => {
    setSelectedUser(subscription);
    setSelectedPlan(subscription.planName.toLowerCase());
    setSelectedStatus(subscription.status);
    setSelectedBillingCycle(subscription.billingCycle);
    setCustomAmount(subscription.amount.toString());
    setPlanNotes('');
    setResetUsage(false);
    setShowPlanModal(true);
  };

  const closePlanModal = () => {
    setShowPlanModal(false);
    setSelectedUser(null);
    setSelectedPlan('');
    setSelectedStatus('');
    setSelectedBillingCycle('monthly');
    setCustomAmount('');
    setPlanNotes('');
    setResetUsage(false);
  };

  const openAssignModal = () => {
    setShowAssignModal(true);
    setUserSearchTerm('');
    setSearchResults([]);
    setSelectedUserForAssignment(null);
    setSelectedPlan('free');
    setSelectedStatus('active');
    setSelectedBillingCycle('monthly');
    setCustomAmount('');
    setPlanNotes('');
    setResetUsage(false);
  };

  const closeAssignModal = () => {
    setShowAssignModal(false);
    setUserSearchTerm('');
    setSearchResults([]);
    setSelectedUserForAssignment(null);
    setSelectedPlan('');
    setSelectedStatus('');
    setSelectedBillingCycle('monthly');
    setCustomAmount('');
    setPlanNotes('');
    setResetUsage(false);
  };

  // Search for users
  const searchUsers = async (search: string) => {
    if (!search || search.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/admin/billing/assign-plan?search=${encodeURIComponent(search)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.users || []);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (userSearchTerm) {
        searchUsers(userSearchTerm);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [userSearchTerm]);

  const handleUpdatePlan = async () => {
    if (!selectedUser || !selectedPlan) return;

    setIsUpdating(true);
    try {
      const response = await fetch('/api/admin/billing/assign-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.managerId,
          planName: selectedPlan,
          subscriptionStatus: selectedStatus || 'active',
          billingCycle: selectedBillingCycle,
          customAmount: customAmount ? parseFloat(customAmount) : undefined,
          notes: planNotes || undefined,
          resetUsage: resetUsage
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Update local state
        setSubscriptions(prev => prev.map(sub =>
          sub.id === selectedUser.id
            ? {
                ...sub,
                planName: selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1),
                status: selectedStatus as any,
                billingCycle: selectedBillingCycle as any,
                amount: customAmount ? parseFloat(customAmount) : sub.amount
              }
            : sub
        ));
        closePlanModal();
        alert(`Plan ${data.isUpgrade ? 'upgraded' : data.isDowngrade ? 'downgraded' : 'updated'} successfully!`);
      } else {
        alert(`Failed to update plan: ${data.error}`);
      }
    } catch (error) {
      console.error('Error updating plan:', error);
      alert('An error occurred while updating the plan');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAssignPlan = async () => {
    if (!selectedUserForAssignment || !selectedPlan) return;

    setIsUpdating(true);
    try {
      const response = await fetch('/api/admin/billing/assign-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserForAssignment.id,
          planName: selectedPlan,
          subscriptionStatus: selectedStatus || 'active',
          billingCycle: selectedBillingCycle,
          customAmount: customAmount ? parseFloat(customAmount) : undefined,
          notes: planNotes || undefined,
          resetUsage: resetUsage
        })
      });

      const data = await response.json();

      if (response.ok) {
        closeAssignModal();
        alert(`Plan assigned successfully to ${selectedUserForAssignment.fullName || selectedUserForAssignment.email}!`);
        // Refresh subscriptions list
        const subsResponse = await fetch('/api/admin/billing/subscriptions');
        if (subsResponse.ok) {
          const subsData = await subsResponse.json();
          setSubscriptions(subsData.subscriptions || []);
        }
      } else {
        alert(`Failed to assign plan: ${data.error}`);
      }
    } catch (error) {
      console.error('Error assigning plan:', error);
      alert('An error occurred while assigning the plan');
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing Management</h1>
          <p className="text-gray-600">Manage manager subscriptions and billing</p>
        </div>
        <Button
          onClick={openAssignModal}
          className="bg-[#6566F1] hover:bg-[#5A5BD9] text-white flex items-center gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Assign Plan to User
        </Button>
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

      {/* Edit Plan Modal (for existing subscriptions) */}
      {showPlanModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Edit Subscription</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedUser.managerName} ({selectedUser.managerEmail})
                </p>
                <Badge className="mt-2 bg-blue-100 text-blue-800">
                  Current: {selectedUser.planName}
                </Badge>
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
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_PLANS.map((plan) => (
                    <label
                      key={plan.id}
                      className={`flex flex-col p-3 border rounded-lg cursor-pointer transition-all ${
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
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900">{plan.name}</p>
                        {selectedPlan === plan.id && (
                          <CheckCircle className="w-4 h-4 text-[#6566F1]" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{plan.description}</p>
                    </label>
                  ))}
                </div>
              </div>

              {/* Two columns for Status and Billing Cycle */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Status
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6566F1] focus:border-transparent text-sm"
                  >
                    {SUBSCRIPTION_STATUSES.map((status) => (
                      <option key={status.id} value={status.id}>
                        {status.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Billing Cycle
                  </label>
                  <select
                    value={selectedBillingCycle}
                    onChange={(e) => setSelectedBillingCycle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6566F1] focus:border-transparent text-sm"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              {/* Custom Amount */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Custom Amount (USD) - Optional
                </label>
                <Input
                  type="number"
                  placeholder="Leave empty for default pricing"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">Override the default plan price</p>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Notes (Optional)
                </label>
                <Input
                  type="text"
                  placeholder="Reason for change..."
                  value={planNotes}
                  onChange={(e) => setPlanNotes(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Reset Usage Checkbox */}
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={resetUsage}
                  onChange={(e) => setResetUsage(e.target.checked)}
                  className="w-4 h-4 text-[#6566F1] rounded border-gray-300 focus:ring-[#6566F1]"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">Reset Usage Counter</p>
                  <p className="text-xs text-gray-500">Reset messages used this month to 0</p>
                </div>
              </label>

              {/* Warning */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> This will manually override the subscription.
                  For Stripe-connected users, ensure billing is updated separately if needed.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <Button
                onClick={handleUpdatePlan}
                disabled={isUpdating || !selectedPlan}
                className="flex-1 bg-[#6566F1] hover:bg-[#5A5BD9] text-white"
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Plan'
                )}
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

      {/* Assign Plan to User Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Assign Plan to User</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Search for a user and assign them a subscription plan
                </p>
              </div>
              <button
                onClick={closeAssignModal}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* User Search */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Search User
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search by name or email..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Search Results */}
                {isSearching && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg text-center text-sm text-gray-500">
                    <RefreshCw className="w-4 h-4 animate-spin inline mr-2" />
                    Searching...
                  </div>
                )}

                {!isSearching && searchResults.length > 0 && (
                  <div className="mt-2 border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                    {searchResults.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => setSelectedUserForAssignment(user)}
                        className={`w-full p-3 text-left hover:bg-gray-50 border-b last:border-b-0 transition-colors ${
                          selectedUserForAssignment?.id === user.id ? 'bg-[#6566F1]/5 border-[#6566F1]' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{user.fullName}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="text-xs capitalize">
                              {user.role}
                            </Badge>
                            <p className="text-xs text-gray-500 mt-1">
                              Current: {user.subscriptionPlan}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {!isSearching && userSearchTerm.length >= 2 && searchResults.length === 0 && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg text-center text-sm text-gray-500">
                    No users found
                  </div>
                )}
              </div>

              {/* Selected User Display */}
              {selectedUserForAssignment && (
                <div className="p-3 bg-[#6566F1]/5 border border-[#6566F1]/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{selectedUserForAssignment.fullName}</p>
                      <p className="text-sm text-gray-600">{selectedUserForAssignment.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs capitalize">
                          {selectedUserForAssignment.role}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Current: {selectedUserForAssignment.subscriptionPlan}
                        </Badge>
                      </div>
                    </div>
                    <CheckCircle className="w-5 h-5 text-[#6566F1]" />
                  </div>
                </div>
              )}

              {/* Plan Selection */}
              {selectedUserForAssignment && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Select Plan
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {AVAILABLE_PLANS.map((plan) => (
                        <label
                          key={plan.id}
                          className={`flex flex-col p-3 border rounded-lg cursor-pointer transition-all ${
                            selectedPlan === plan.id
                              ? 'border-[#6566F1] bg-[#6566F1]/5 ring-2 ring-[#6566F1]/20'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="assignPlan"
                            value={plan.id}
                            checked={selectedPlan === plan.id}
                            onChange={(e) => setSelectedPlan(e.target.value)}
                            className="sr-only"
                          />
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-gray-900">{plan.name}</p>
                            {selectedPlan === plan.id && (
                              <CheckCircle className="w-4 h-4 text-[#6566F1]" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{plan.description}</p>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Two columns for Status and Billing Cycle */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Status
                      </label>
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6566F1] focus:border-transparent text-sm"
                      >
                        {SUBSCRIPTION_STATUSES.map((status) => (
                          <option key={status.id} value={status.id}>
                            {status.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Billing Cycle
                      </label>
                      <select
                        value={selectedBillingCycle}
                        onChange={(e) => setSelectedBillingCycle(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6566F1] focus:border-transparent text-sm"
                      >
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                  </div>

                  {/* Custom Amount */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Custom Amount (USD) - Optional
                    </label>
                    <Input
                      type="number"
                      placeholder="Leave empty for default pricing"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Notes (Optional)
                    </label>
                    <Input
                      type="text"
                      placeholder="Reason for assignment..."
                      value={planNotes}
                      onChange={(e) => setPlanNotes(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </>
              )}

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Info:</strong> This will update the user&apos;s subscription plan and create
                  a subscription record if they are a manager. Billing dates will be set automatically.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <Button
                onClick={handleAssignPlan}
                disabled={isUpdating || !selectedUserForAssignment || !selectedPlan}
                className="flex-1 bg-[#6566F1] hover:bg-[#5A5BD9] text-white"
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Assign Plan
                  </>
                )}
              </Button>
              <Button
                onClick={closeAssignModal}
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
