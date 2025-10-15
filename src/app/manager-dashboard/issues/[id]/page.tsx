'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Mail,
  Calendar,
  MessageSquare,
  Send,
  ArrowLeft,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import RoleGuard from '@/components/auth/RoleGuard';
import { useRouter } from 'next/navigation';

interface Issue {
  id: string;
  type: string;
  userId: string;
  userEmail: string;
  userName: string;
  message: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  notes?: string;
  response?: string;
  createdAt: string;
  updatedAt: string;
}

interface CustomerHistoryIssue {
  id: string;
  type: string;
  message: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
}

const IssueDetailPage = ({ params }: { params: { id: string } }) => {
  const router = useRouter();
  const { showToast } = useToast();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [customerHistory, setCustomerHistory] = useState<CustomerHistoryIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [notesText, setNotesText] = useState('');
  const [currentHistoryPage, setCurrentHistoryPage] = useState(1);
  const historyPerPage = 4;

  // Mock data - would be fetched from API in production
  const mockIssue: Issue = {
    id: params.id,
    type: 'technical',
    userId: 'user2',
    userEmail: 'mike.chen@company.com',
    userName: 'Mike Chen',
    message: 'The chatbot is extremely slow and taking 30+ seconds to respond to messages: I\'ve been experiencing severe performance issues with your chatbot service over the past week. Response times have been consistently slow, often taking 30 seconds or more to get a reply, which is completely unacceptable for our business needs.',
    status: 'in_progress',
    priority: 'urgent',
    assignedTo: 'John Smith',
    notes: 'Customer reported slow response times. Checking server performance and response handling.',
    response: 'Hi Mike, I\'m investigating the slow response times you\'re experiencing. This is a high priority issue and I\'ll get back to you within 2 hours with an update.',
    createdAt: '2024-01-14T14:20:00Z',
    updatedAt: '2024-01-14T16:45:00Z'
  };

  const mockCustomerHistory: CustomerHistoryIssue[] = [
    {
      id: '101',
      type: 'billing',
      message: 'Need help with upgrading my subscription plan',
      status: 'resolved',
      priority: 'medium',
      createdAt: '2024-01-10T09:00:00Z',
      updatedAt: '2024-01-10T10:30:00Z'
    },
    {
      id: '102',
      type: 'technical',
      message: 'Unable to connect chatbot to my website',
      status: 'resolved',
      priority: 'high',
      createdAt: '2024-01-05T14:15:00Z',
      updatedAt: '2024-01-05T18:45:00Z'
    },
    {
      id: '103',
      type: 'feature_request',
      message: 'Can we customize the chatbot colors?',
      status: 'resolved',
      priority: 'low',
      createdAt: '2023-12-28T11:30:00Z',
      updatedAt: '2023-12-29T09:15:00Z'
    },
    {
      id: '104',
      type: 'technical',
      message: 'Getting error when trying to view analytics',
      status: 'resolved',
      priority: 'medium',
      createdAt: '2023-12-20T16:00:00Z',
      updatedAt: '2023-12-21T10:30:00Z'
    },
    {
      id: '105',
      type: 'billing',
      message: 'Question about invoice charges',
      status: 'resolved',
      priority: 'medium',
      createdAt: '2023-12-15T10:00:00Z',
      updatedAt: '2023-12-15T14:20:00Z'
    }
  ];

  useEffect(() => {
    // Simulate API fetch
    const fetchIssueDetails = async () => {
      try {
        setLoading(true);
        // In production, this would fetch from: /api/manager/issues/${params.id}
        setTimeout(() => {
          setIssue(mockIssue);
          setResponseText(mockIssue.response || '');
          setNotesText(mockIssue.notes || '');
          setCustomerHistory(mockCustomerHistory);
          setLoading(false);
        }, 500);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load issue');
        setLoading(false);
      }
    };

    fetchIssueDetails();
  }, [params.id]);

  // Calculate pagination for customer history
  const totalHistoryPages = Math.ceil(customerHistory.length / historyPerPage);
  const startHistoryIndex = (currentHistoryPage - 1) * historyPerPage;
  const endHistoryIndex = startHistoryIndex + historyPerPage;
  const paginatedHistory = customerHistory.slice(startHistoryIndex, endHistoryIndex);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'in_progress': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'resolved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'closed': return 'bg-slate-50 text-slate-700 border-slate-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-50 text-red-700 border-red-200';
      case 'high': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'human_request': return <User className="w-4 h-4" />;
      case 'issue_report': return <AlertTriangle className="w-4 h-4" />;
      case 'end_chat': return <XCircle className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  // Get type label
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'human_request': return 'Human Request';
      case 'issue_report': return 'Issue Report';
      case 'end_chat': return 'End Chat';
      default: type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
    }
  };

  // Update issue status
  const updateIssueStatus = async (newStatus: string) => {
    try {
      // In production: await fetch(`/api/manager/issues/${params.id}`, { method: 'PATCH', body: JSON.stringify({ status: newStatus }) })
      if (issue) {
        setIssue({ ...issue, status: newStatus as any });
      }
    } catch (err) {
      console.error('Failed to update issue status:', err);
    }
  };

  // Update issue details
  const updateIssueDetails = async () => {
    try {
      // In production: await fetch(`/api/manager/issues/${params.id}`, { method: 'PATCH', body: JSON.stringify({ response: responseText, notes: notesText }) })
      if (issue) {
        setIssue({ ...issue, response: responseText, notes: notesText });
      }
      showToast('Changes saved successfully!', 'success');
    } catch (err) {
      console.error('Failed to update issue details:', err);
      showToast('Failed to save changes', 'error');
    }
  };

  // Handle assign to agent (auto-assign to issue owner)
  const handleAssignToAgent = async () => {
    if (!issue) return;

    try {
      // In production: This would fetch the user who created the issue and assign them
      const assignee = issue.userName; // Auto-assign to the person whose issue it is
      setIssue({ ...issue, assignedTo: assignee });
      showToast(`Issue automatically assigned to ${assignee}`, 'success');
    } catch (err) {
      console.error('Failed to assign agent:', err);
      showToast('Failed to assign agent', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5A5BD8]"></div>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Issue</h3>
        <p className="text-gray-500">{error || 'Issue not found'}</p>
        <Button
          onClick={() => router.push('/manager-dashboard/issues')}
          className="mt-4"
        >
          Back to Issues
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Back Button */}
      <Button
        variant="outline"
        onClick={() => router.push('/manager-dashboard/issues')}
        className="flex items-center space-x-2"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Issues</span>
      </Button>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Issue Details</h1>
        <p className="text-sm text-gray-600 mt-1">Manage and respond to customer issue</p>
      </div>

      {/* Issue Header Card */}
      <Card className="bg-white rounded-xl shadow-sm border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-lg font-medium text-gray-600">
                  {issue.userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{issue.userName}</h2>
                <p className="text-sm text-gray-600">{issue.userEmail}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={`text-xs font-medium ${getPriorityColor(issue.priority)}`}>
                {issue.priority} priority
              </Badge>
              <Badge className={`text-xs font-medium ${getStatusColor(issue.status)}`}>
                {issue.status.replace('_', ' ')}
              </Badge>
              <Badge className="text-xs font-medium bg-gray-100 text-gray-700">
                {getTypeLabel(issue.type)}
              </Badge>
            </div>
          </div>

          <div className="flex items-center space-x-6 text-sm text-gray-600">
            <span className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>Created: {new Date(issue.createdAt).toLocaleString()}</span>
            </span>
            <span className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Updated: {new Date(issue.updatedAt).toLocaleString()}</span>
            </span>
            {issue.assignedTo && (
              <span className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Assigned to: {issue.assignedTo}</span>
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions Required */}
      {!issue.assignedTo && (
        <Card className="bg-white rounded-xl shadow-sm border-0">
          <CardContent className="p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-2">Actions Required</h3>
            <p className="text-sm text-gray-600 mb-4">Assign an agent to handle this issue automatically.</p>
            <Button
              onClick={handleAssignToAgent}
              className="bg-[#5A5BD8] hover:bg-[#4A4BC8] text-white"
            >
              <User className="w-4 h-4 mr-2" />
              Assign to Agent
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Customer Issue */}
      <Card className="bg-white rounded-xl shadow-sm border-0">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3">Customer Issue</h3>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="text-base font-semibold text-gray-900 mb-3">
              {issue.message.split(':')[0] || issue.message}
            </h4>
            <p className="text-sm text-gray-700 leading-relaxed">
              {issue.message.includes(':') ? issue.message.split(':').slice(1).join(':').trim() : issue.message}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Reply to Customer */}
      <Card className="bg-white rounded-xl shadow-sm border-0">
        <CardContent className="p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-2">Reply to Customer</h3>
          <p className="text-sm text-gray-600 mb-4">Send a response to the customer about their issue.</p>
          <textarea
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            placeholder="Type your reply to the customer..."
            className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A5BD8] focus:border-[#5A5BD8] resize-none text-gray-900 placeholder-gray-500"
          />
          {issue.response && (
            <div className="mt-4">
              <h4 className="text-sm font-bold text-gray-900 mb-2">Previous Response</h4>
              <div className="bg-[#5A5BD8]/5 rounded-lg p-4 border border-[#5A5BD8]/20">
                <p className="text-sm text-gray-800 leading-relaxed">{issue.response}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Internal Notes */}
      <Card className="bg-white rounded-xl shadow-sm border-0">
        <CardContent className="p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-2">Internal Notes</h3>
          <p className="text-sm text-gray-600 mb-4">Add private notes about this issue (not visible to customer).</p>
          <textarea
            value={notesText}
            onChange={(e) => setNotesText(e.target.value)}
            placeholder="Add internal notes about this issue..."
            className="w-full h-24 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A5BD8] focus:border-[#5A5BD8] resize-none text-gray-900 placeholder-gray-500"
          />
        </CardContent>
      </Card>

      {/* Customer Issue History */}
      <Card className="bg-white rounded-xl shadow-sm border-0">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Customer Issue History</h3>
          <p className="text-sm text-gray-600 mb-4">Previous issues reported by this customer</p>

          {paginatedHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-sm">No previous issues found</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {paginatedHistory.map((historyIssue) => (
                  <div
                    key={historyIssue.id}
                    className="p-4 rounded-lg border border-gray-200 hover:border-[#5A5BD8] hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(historyIssue.type)}
                        <span className="text-sm font-medium text-gray-900">
                          {historyIssue.message}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={`text-xs font-medium ${getPriorityColor(historyIssue.priority)}`}>
                          {historyIssue.priority}
                        </Badge>
                        <Badge className={`text-xs font-medium ${getStatusColor(historyIssue.status)}`}>
                          {historyIssue.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(historyIssue.createdAt).toLocaleDateString()} - {new Date(historyIssue.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>

              {/* History Pagination */}
              {totalHistoryPages > 1 && (
                <div className="mt-4 flex items-center justify-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentHistoryPage(prev => Math.max(1, prev - 1))}
                    disabled={currentHistoryPage === 1}
                    className="p-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>

                  {Array.from({ length: totalHistoryPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentHistoryPage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentHistoryPage(page)}
                      className={`px-3 py-1 ${
                        currentHistoryPage === page
                          ? 'bg-[#5A5BD8] text-white hover:bg-[#4A4BC8]'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </Button>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentHistoryPage(prev => Math.min(totalHistoryPages, prev + 1))}
                    disabled={currentHistoryPage === totalHistoryPages}
                    className="p-2"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Actions Footer */}
      <Card className="bg-white rounded-xl shadow-sm border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-semibold text-gray-700">Status:</label>
              <select
                value={issue.status}
                onChange={(e) => updateIssueStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A5BD8] focus:border-[#5A5BD8] text-sm text-gray-900"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <Button
              onClick={updateIssueDetails}
              className="bg-[#5A5BD8] hover:bg-[#4A4BC8] text-white px-6 py-2"
            >
              <Send className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

import { ToastProvider } from '@/components/ui/toast';

export default function IssueDetailPageWrapper({ params }: { params: { id: string } }) {
  return (
    <RoleGuard allowedRoles={['manager']}>
      <ToastProvider>
        <IssueDetailPage params={params} />
      </ToastProvider>
    </RoleGuard>
  );
}
