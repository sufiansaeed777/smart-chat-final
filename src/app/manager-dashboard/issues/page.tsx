'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  User,
  MessageSquare,
  Eye,
  Search,
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

const ManagerIssuesPage = () => {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const issuesPerPage = 10;
  const [issues, setIssues] = useState<Issue[]>([
    {
      id: '1',
      type: 'billing',
      userId: 'user1',
      userEmail: 'sarah.johnson@university.edu',
      userName: 'Sarah Johnson',
      message: 'Is there a student discount available for your chatbot service?: I\'m a university student working on my research project and I\'m very interested in using your chatbot service to help with data collection and user interactions.',
      status: 'pending',
      priority: 'medium',
      assignedTo: undefined,
      notes: undefined,
      response: undefined,
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      type: 'technical',
      userId: 'user2',
      userEmail: 'mike.chen@company.com',
      userName: 'Mike Chen',
      message: 'The chatbot is extremely slow and taking 30+ seconds to respond to messages: I\'ve been experiencing severe performance issues with your chatbot service over the past week.',
      status: 'in_progress',
      priority: 'urgent',
      assignedTo: 'John Smith',
      notes: 'Customer reported slow response times. Checking server performance and response handling.',
      response: 'Hi Mike, I\'m investigating the slow response times you\'re experiencing.',
      createdAt: '2024-01-14T14:20:00Z',
      updatedAt: '2024-01-14T16:45:00Z'
    },
    {
      id: '3',
      type: 'feature_request',
      userId: 'user3',
      userEmail: 'emily.r@startup.io',
      userName: 'Emily Rodriguez',
      message: 'Can you add meeting scheduling functionality to the chatbot?: I absolutely love using your chatbot for customer support, but it would be a game-changer.',
      status: 'pending',
      priority: 'medium',
      assignedTo: undefined,
      notes: undefined,
      response: undefined,
      createdAt: '2024-01-13T09:15:00Z',
      updatedAt: '2024-01-13T09:15:00Z'
    },
    {
      id: '4',
      type: 'technical',
      userId: 'user4',
      userEmail: 'david.kim@techcorp.com',
      userName: 'David Kim',
      message: 'Unable to log into my account through the chatbot despite correct credentials: I\'m having a persistent login issue with your chatbot service.',
      status: 'resolved',
      priority: 'high',
      assignedTo: 'Lisa Wang',
      notes: 'Reset user password and cleared session cache. Issue resolved.',
      response: 'Hi David, I\'ve reset your password and cleared your session cache.',
      createdAt: '2024-01-12T16:30:00Z',
      updatedAt: '2024-01-12T18:20:00Z'
    },
    {
      id: '5',
      type: 'technical',
      userId: 'user5',
      userEmail: 'alex.t@business.com',
      userName: 'Alex Thompson',
      message: 'Export feature is completely broken and downloading empty files: I urgently need to export my conversation history for compliance and audit purposes.',
      status: 'pending',
      priority: 'high',
      assignedTo: undefined,
      notes: undefined,
      response: undefined,
      createdAt: '2024-01-11T11:45:00Z',
      updatedAt: '2024-01-11T11:45:00Z'
    },
    {
      id: '6',
      type: 'billing',
      userId: 'user6',
      userEmail: 'jessica.m@enterprise.com',
      userName: 'Jessica Martinez',
      message: 'I was double charged for my monthly subscription and need an immediate refund: I discovered that I was charged twice for my monthly subscription this month.',
      status: 'pending',
      priority: 'urgent',
      assignedTo: undefined,
      notes: undefined,
      response: undefined,
      createdAt: '2024-01-10T08:30:00Z',
      updatedAt: '2024-01-10T08:30:00Z'
    },
    {
      id: '7',
      type: 'technical',
      userId: 'user7',
      userEmail: 'robert.w@agency.com',
      userName: 'Robert Wilson',
      message: 'Mobile app has severe issues with message display and response delays: The chatbot is completely unusable on my mobile app due to multiple critical issues.',
      status: 'in_progress',
      priority: 'high',
      assignedTo: 'Sarah Lee',
      notes: 'Investigating mobile app integration issues. Testing on different devices and OS versions.',
      response: 'Hi Robert, I\'m looking into the mobile app issues you\'re experiencing.',
      createdAt: '2024-01-09T15:20:00Z',
      updatedAt: '2024-01-09T17:10:00Z'
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'resolved' | 'closed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'urgent'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch issues from API
  useEffect(() => {
    const fetchIssues = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/manager/issues');

        if (!response.ok) {
          throw new Error('Failed to fetch issues');
        }

        const data = await response.json();
        setIssues(data.issues || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchIssues();
  }, []);

  // Filter issues based on selected filters
  const filteredIssues = issues.filter(issue => {
    const matchesStatus = filter === 'all' || issue.status === filter;
    const matchesPriority = priorityFilter === 'all' || issue.priority === priorityFilter;
    const matchesSearch = searchTerm === '' ||
      issue.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.message.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesPriority && matchesSearch;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredIssues.length / issuesPerPage);
  const startIndex = (currentPage - 1) * issuesPerPage;
  const endIndex = startIndex + issuesPerPage;
  const paginatedIssues = filteredIssues.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, priorityFilter, searchTerm]);

  // Calculate stats
  const totalIssues = issues.length;
  const pendingIssues = issues.filter(i => i.status === 'pending').length;
  const activeIssues = issues.filter(i => i.status === 'in_progress').length;
  const solvedIssues = issues.filter(i => i.status === 'resolved').length;
  const unsolvedIssues = issues.filter(i => i.status !== 'resolved' && i.status !== 'closed').length;

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

  // Handle issue click - navigate to detail page
  const handleIssueClick = (issueId: string) => {
    router.push(`/manager-dashboard/issues/${issueId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5A5BD8]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Issues</h3>
        <p className="text-gray-500">{error}</p>
        <Button
          onClick={() => window.location.reload()}
          className="mt-4"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Issues Management</h1>
        <p className="text-sm text-gray-600 mt-1">Monitor and resolve customer issues</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="bg-white rounded-xl shadow-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{totalIssues}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl shadow-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">{pendingIssues}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl shadow-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{activeIssues}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl shadow-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Solved</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{solvedIssues}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl shadow-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unsolved</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{unsolvedIssues}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white rounded-xl shadow-sm border-0">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search issues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A5BD8] focus:border-[#5A5BD8] text-sm bg-white text-gray-900 placeholder-gray-500"
              />
            </div>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A5BD8] focus:border-[#5A5BD8] text-sm bg-white text-gray-900"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A5BD8] focus:border-[#5A5BD8] text-sm bg-white text-gray-900"
            >
              <option value="all">All Priority</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Issues Table */}
      <Card className="bg-white rounded-xl shadow-sm border-0">
        <CardContent className="p-0">
          {paginatedIssues.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No issues found</h3>
              <p className="text-gray-600 text-sm">
                {searchTerm || filter !== 'all' || priorityFilter !== 'all'
                  ? 'No issues match your current filters.'
                  : 'No customer issues have been reported yet.'
                }
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedIssues.map((issue) => (
                      <tr
                        key={issue.id}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => handleIssueClick(issue.id)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-medium text-gray-600">
                                {issue.userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{issue.userName}</div>
                              <div className="text-sm text-gray-500">{issue.userEmail}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {issue.message.split(':')[0] || issue.message}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={`text-xs font-medium ${getPriorityColor(issue.priority)}`}>
                            {issue.priority}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={`text-xs font-medium ${getStatusColor(issue.status)}`}>
                            {issue.status.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            {getTypeIcon(issue.type)}
                            <span className="ml-2">{issue.type.replace('_', ' ')}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(issue.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleIssueClick(issue.id);
                            }}
                            className="text-[#5A5BD8] hover:text-[#4A4BC8] hover:bg-[#5A5BD8]/10"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredIssues.length)} of {filteredIssues.length} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-2"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 ${
                          currentPage === page
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
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default function ManagerIssuesPageWrapper() {
  return (
    <RoleGuard allowedRoles={['manager']}>
      <ManagerIssuesPage />
    </RoleGuard>
  );
}
