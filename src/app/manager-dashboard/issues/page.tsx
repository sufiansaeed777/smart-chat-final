'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  XCircle, 
  User, 
  Mail, 
  Calendar,
  Filter,
  Search,
  MoreVertical,
  MessageSquare,
  Eye,
  Edit,
  MessageCircle,
  ArrowRight,
  Send
} from 'lucide-react';
import RoleGuard from '@/components/auth/RoleGuard';

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
  const [issues, setIssues] = useState<Issue[]>([
    {
      id: '1',
      type: 'billing',
      userId: 'user1',
      userEmail: 'sarah.johnson@university.edu',
      userName: 'Sarah Johnson',
      message: 'Is there a student discount available for your chatbot service?: I\'m a university student working on my research project and I\'m very interested in using your chatbot service to help with data collection and user interactions. I\'ve been exploring your pricing page but I don\'t see any special pricing options for students or educational institutions. This would be incredibly helpful for staying within my research budget, as I\'m funding this project myself. I\'d love to know if you offer any educational discounts or if there\'s a way to get a reduced rate for academic use.',
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
      message: 'The chatbot is extremely slow and taking 30+ seconds to respond to messages: I\'ve been experiencing severe performance issues with your chatbot service over the past week. Response times have been consistently slow, often taking 30 seconds or more to get a reply, which is completely unacceptable for our business needs. I\'ve tried refreshing the page multiple times, clearing my browser cache, and even restarting my browser, but the problem persists across different devices and browsers. This is significantly impacting our team\'s productivity and customer satisfaction, and we\'re considering switching to a competitor if this isn\'t resolved quickly.',
      status: 'in_progress',
      priority: 'urgent',
      assignedTo: 'John Smith',
      notes: 'Customer reported slow response times. Checking server performance and response handling.',
      response: 'Hi Mike, I\'m investigating the slow response times you\'re experiencing. This is a high priority issue and I\'ll get back to you within 2 hours with an update.',
      createdAt: '2024-01-14T14:20:00Z',
      updatedAt: '2024-01-14T16:45:00Z'
    },
    {
      id: '3',
      type: 'feature_request',
      userId: 'user3',
      userEmail: 'emily.r@startup.io',
      userName: 'Emily Rodriguez',
      message: 'Can you add meeting scheduling functionality to the chatbot?: I absolutely love using your chatbot for customer support, but it would be a game-changer if you could add the ability to schedule meetings directly through the bot. Currently, I have to switch between the chatbot and my calendar app constantly, which is very time-consuming and creates a fragmented user experience. This feature would save our team hours every week and make our workflow much more efficient. We could handle everything from initial inquiry to meeting scheduling in one seamless conversation, which would significantly improve our customer experience and reduce the chance of missed appointments.',
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
      message: 'Unable to log into my account through the chatbot despite correct credentials: I\'m having a persistent login issue with your chatbot service. Even though I can successfully log into my account through the web interface using the same credentials, the chatbot keeps returning "invalid credentials" errors. I\'ve already tried resetting my password twice, clearing my browser cache, and using different browsers, but the problem persists. This is preventing me from accessing my account settings, support history, and other important features through the chatbot. I need this resolved urgently as I rely on the chatbot for daily operations.',
      status: 'resolved',
      priority: 'high',
      assignedTo: 'Lisa Wang',
      notes: 'Reset user password and cleared session cache. Issue resolved.',
      response: 'Hi David, I\'ve reset your password and cleared your session cache. You should now be able to log in through the chatbot. Please try again and let me know if you still have issues.',
      createdAt: '2024-01-12T16:30:00Z',
      updatedAt: '2024-01-12T18:20:00Z'
    },
    {
      id: '5',
      type: 'technical',
      userId: 'user5',
      userEmail: 'alex.t@business.com',
      userName: 'Alex Thompson',
      message: 'Export feature is completely broken and downloading empty files: I urgently need to export my conversation history for compliance and audit purposes, but the export feature is completely non-functional. Every time I attempt to download the file, it either shows an error message or downloads an empty file with no data. I\'ve tried multiple browsers, different file formats (CSV, PDF, JSON), and various date ranges, but nothing works. This is extremely urgent as I have a compliance audit scheduled for next week and I need these conversation records to demonstrate our customer interactions. Without this data, we could face serious regulatory issues.',
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
      message: 'I was double charged for my monthly subscription and need an immediate refund: I discovered that I was charged twice for my monthly subscription this month, which is completely unacceptable. I can clearly see two identical charges on my credit card statement for the same amount and date, but I only have one active subscription in my account. I\'ve already attached my bank statement showing both charges for your reference. This duplicate charge is affecting our monthly budget and cash flow, and I need this resolved immediately. Please process a full refund for the duplicate charge and ensure this billing error doesn\'t happen again.',
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
      message: 'Mobile app has severe issues with message display and response delays: The chatbot is completely unusable on my mobile app due to multiple critical issues. Messages are getting cut off mid-sentence, responses are delayed by several minutes, and sometimes messages don\'t appear at all. I\'ve tried updating the app to the latest version, restarting my phone, and even reinstalling the app, but the problems persist across different devices and operating systems. This is extremely frustrating when I\'m traveling or working remotely and need quick support. The mobile experience is so poor that I\'m considering canceling my subscription if this isn\'t fixed soon.',
      status: 'in_progress',
      priority: 'high',
      assignedTo: 'Sarah Lee',
      notes: 'Investigating mobile app integration issues. Testing on different devices and OS versions.',
      response: 'Hi Robert, I\'m looking into the mobile app issues you\'re experiencing. This is a known issue we\'re working on and I\'ll update you soon with a fix.',
      createdAt: '2024-01-09T15:20:00Z',
      updatedAt: '2024-01-09T17:10:00Z'
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'resolved' | 'closed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'urgent'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [responseText, setResponseText] = useState('');
  const [notesText, setNotesText] = useState('');

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

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm';
      case 'in_progress': return 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm';
      case 'resolved': return 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm';
      case 'closed': return 'bg-slate-50 text-slate-700 border-slate-200 shadow-sm';
      default: return 'bg-slate-50 text-slate-700 border-slate-200 shadow-sm';
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-50 text-red-700 border-red-200 shadow-sm';
      case 'high': return 'bg-orange-50 text-orange-700 border-orange-200 shadow-sm';
      case 'medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200 shadow-sm';
      case 'low': return 'bg-green-50 text-green-700 border-green-200 shadow-sm';
      default: return 'bg-slate-50 text-slate-700 border-slate-200 shadow-sm';
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
      default: return 'Unknown';
    }
  };

  // Update issue status
  const updateIssueStatus = async (issueId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/manager/issues/${issueId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update issue status');
      }

      // Update local state
      setIssues(prevIssues =>
        prevIssues.map(issue =>
          issue.id === issueId ? { ...issue, status: newStatus as any } : issue
        )
      );

      // Update selected issue if it's the same
      if (selectedIssue && selectedIssue.id === issueId) {
        setSelectedIssue({ ...selectedIssue, status: newStatus as any });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update issue');
    }
  };

  // Update issue with response and notes
  const updateIssueDetails = async (issueId: string, response?: string, notes?: string) => {
    try {
      const response_data = await fetch(`/api/manager/issues/${issueId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ response, notes }),
      });

      if (!response_data.ok) {
        throw new Error('Failed to update issue details');
      }

      // Update local state
      setIssues(prevIssues =>
        prevIssues.map(issue =>
          issue.id === issueId ? { ...issue, response, notes } : issue
        )
      );

      // Update selected issue if it's the same
      if (selectedIssue && selectedIssue.id === issueId) {
        setSelectedIssue({ ...selectedIssue, response, notes });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update issue details');
    }
  };

  // Handle issue selection
  const handleSelectIssue = (issue: Issue) => {
    setSelectedIssue(issue);
    setResponseText(issue.response || '');
    setNotesText(issue.notes || '');
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
    <div className="h-full flex bg-slate-100 p-6 gap-6">
      {/* Left Sidebar - Issues List */}
      <div className="w-1/3 bg-white rounded-xl shadow-lg flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-slate-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Active Issues</h1>
              <p className="text-sm text-slate-600">Monitor and resolve customer issues</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center bg-slate-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-slate-900">{issues.length}</div>
              <div className="text-xs text-slate-600">Total</div>
            </div>
            <div className="text-center bg-slate-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-orange-600">
                {issues.filter(i => i.status === 'pending').length}
              </div>
              <div className="text-xs text-slate-600">Pending</div>
            </div>
            <div className="text-center bg-slate-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-green-600">
                {issues.filter(i => i.status === 'in_progress').length}
              </div>
              <div className="text-xs text-slate-600">Active</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-slate-200">
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search issues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#5A5BD8] focus:border-[#5A5BD8] text-sm bg-white text-slate-900 placeholder-slate-500"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#5A5BD8] focus:border-[#5A5BD8] text-sm bg-white text-slate-900"
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
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#5A5BD8] focus:border-[#5A5BD8] text-sm bg-white text-slate-900"
              >
                <option value="all">All Priority</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Issues List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredIssues.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No issues found</h3>
              <p className="text-slate-600 text-sm">
                {searchTerm || filter !== 'all' || priorityFilter !== 'all'
                  ? 'No issues match your current filters.'
                  : 'No customer issues have been reported yet.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredIssues.map((issue) => (
                <div
                  key={issue.id}
                  className={`rounded-lg border transition-all duration-200 hover:shadow-md ${
                    selectedIssue?.id === issue.id 
                      ? 'bg-[#5A5BD8]/10 border-[#5A5BD8] shadow-md' 
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  {/* Header */}
                  <div 
                    className="p-3 cursor-pointer"
                    onClick={() => handleSelectIssue(issue)}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        selectedIssue?.id === issue.id ? 'bg-[#5A5BD8] text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {getTypeIcon(issue.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {issue.userName}
                        </h4>
                        <p className="text-xs text-slate-500 truncate">
                          {issue.userEmail}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mb-2">
                      <h5 className="text-sm font-semibold text-slate-900 line-clamp-2 leading-relaxed">
                        {issue.message.split(':')[0] || issue.message}
                      </h5>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(issue.priority)}`}>
                        {issue.priority}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(issue.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Issue Details */}
      <div className="flex-1 bg-white rounded-xl shadow-lg">
        {selectedIssue ? (
          <div className="h-full flex flex-col">
            {/* Issue Header */}
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                    {getTypeIcon(selectedIssue.type)}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {selectedIssue.userName}
                    </h2>
                    <p className="text-sm text-slate-600">
                      {selectedIssue.userEmail}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${getPriorityColor(selectedIssue.priority)}`}>
                    {selectedIssue.priority} priority
                  </span>
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700">
                    {getTypeLabel(selectedIssue.type)}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-6 text-sm text-slate-600">
                <span className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>Wait time: {Math.floor((Date.now() - new Date(selectedIssue.createdAt).getTime()) / (1000 * 60))} minutes</span>
                </span>
                <span className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Issue: {selectedIssue.message.split(':')[0] || 'Issue Report'}</span>
                </span>
              </div>
            </div>

            {/* Actions Required */}
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 mb-2">Actions Required</h3>
              <p className="text-sm text-slate-600 mb-4">Assign an agent to handle this issue.</p>
              <div className="flex items-center space-x-3">
                <button className="px-4 py-2 bg-[#5A5BD8] text-white rounded-lg hover:bg-[#4A4BC8] transition-colors text-sm font-medium flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Assign to Agent</span>
                </button>
              </div>
            </div>

            {/* Customer Issue Display */}
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-3">Customer Issue</h3>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h4 className="text-base font-semibold text-slate-900 mb-3">
                  {selectedIssue.message.split(':')[0] || selectedIssue.message}
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {selectedIssue.message.includes(':') ? selectedIssue.message.split(':').slice(1).join(':').trim() : selectedIssue.message}
                </p>
              </div>
            </div>

            {/* Issue Content */}
            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
              {/* Reply to Customer Section */}
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <h3 className="text-sm font-bold text-slate-900 mb-2">Reply to Customer</h3>
                <p className="text-sm text-slate-600 mb-4">Send a response to the customer about their issue.</p>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Type your reply to the customer..."
                  className="w-full h-32 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#5A5BD8] focus:border-[#5A5BD8] resize-none text-slate-900 placeholder-slate-500"
                />
                <div className="flex justify-end mt-3">
                  <button
                    onClick={() => updateIssueDetails(selectedIssue.id, responseText, notesText)}
                    className="px-4 py-2 bg-[#5A5BD8] hover:bg-[#4A4BC8] text-white text-sm font-medium rounded-lg transition-colors duration-200"
                  >
                    Send Reply
                  </button>
                </div>
              </div>

              {/* Internal Notes Section */}
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <h3 className="text-sm font-bold text-slate-900 mb-2">Internal Notes</h3>
                <p className="text-sm text-slate-600 mb-4">Add private notes about this issue (not visible to customer).</p>
                <textarea
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  placeholder="Add internal notes about this issue..."
                  className="w-full h-24 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#5A5BD8] focus:border-[#5A5BD8] resize-none text-slate-900 placeholder-slate-500"
                />
              </div>

              {/* Previous Response */}
              {selectedIssue.response && (
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                  <h3 className="text-sm font-bold text-slate-900 mb-2">Previous Response</h3>
                  <div className="bg-[#5A5BD8]/5 rounded-lg p-4 border border-[#5A5BD8]/20">
                    <p className="text-sm text-slate-800 leading-relaxed">{selectedIssue.response}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="bg-slate-50 border-t border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-semibold text-slate-700">Status:</label>
                    <select
                      value={selectedIssue.status}
                      onChange={(e) => updateIssueStatus(selectedIssue.id, e.target.value)}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#5A5BD8] focus:border-[#5A5BD8] text-sm text-slate-900"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Button
                    onClick={() => updateIssueDetails(selectedIssue.id, responseText, notesText)}
                    className="bg-[#5A5BD8] hover:bg-[#4A4BC8] text-white px-6 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 font-semibold"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Select an Issue</h3>
              <p className="text-slate-600 max-w-md">Choose an issue from the list to view details and manage it. You can filter by status, priority, or search for specific issues.</p>
            </div>
          </div>
        )}
      </div>
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
