'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Send, CheckCircle, Clock, XCircle, Bug, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import RoleGuard from '@/components/auth/RoleGuard';

interface IssueReport {
  id: string;
  type: string;
  description: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

const ReportIssuePage = () => {
  const [issueType, setIssueType] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real data for user's reported issues
  const [userIssues, setUserIssues] = useState<IssueReport[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    resolved: 0
  });

  // Fetch user's issues on component mount
  useEffect(() => {
    const fetchUserIssues = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/user/issues');
        if (response.ok) {
          const data = await response.json();
          setUserIssues(data.issues || []);
          // Handle both 'pending' and 'inProgress' from API
          const apiStats = data.stats || {};
          setStats({
            total: apiStats.total || 0,
            pending: (apiStats.pending || 0) + (apiStats.inProgress || 0),
            resolved: apiStats.resolved || 0
          });
        } else {
          console.error('Failed to fetch user issues');
          setError('Failed to load your issues');
        }
      } catch (error) {
        console.error('Error fetching user issues:', error);
        setError('Failed to load your issues');
      } finally {
        setLoading(false);
      }
    };

    fetchUserIssues();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-600';
      case 'in_progress': return 'bg-blue-100 text-blue-600';
      case 'resolved': return 'bg-green-100 text-green-600';
      case 'closed': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-600';
      case 'high': return 'bg-orange-100 text-orange-600';
      case 'medium': return 'bg-yellow-100 text-yellow-600';
      case 'low': return 'bg-green-100 text-green-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueType || !description) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/user/report-issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          issueType,
          description,
          priority
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSubmitted(true);

        // Refresh the issues list
        const issuesResponse = await fetch('/api/user/issues');
        if (issuesResponse.ok) {
          const issuesData = await issuesResponse.json();
          setUserIssues(issuesData.issues || []);
          // Handle both 'pending' and 'inProgress' from API
          const apiStats = issuesData.stats || {};
          setStats({
            total: apiStats.total || 0,
            pending: (apiStats.pending || 0) + (apiStats.inProgress || 0),
            resolved: apiStats.resolved || 0
          });
        }

        // Reset form after 3 seconds
        setTimeout(() => {
          setSubmitted(false);
          setIssueType('');
          setDescription('');
          setPriority('medium');
        }, 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to submit issue');
      }
    } catch (error) {
      console.error('Error submitting issue:', error);
      setError('Failed to submit issue. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalIssues = stats.total;
  const resolvedIssues = stats.resolved;
  const pendingIssues = stats.pending;

  const metrics = [
    {
      title: "Total Issues",
      value: totalIssues.toString(),
      change: "All time",
      icon: FileText,
      bgColor: "bg-purple-50",
      iconBg: "bg-purple-500",
      textColor: "text-purple-600"
    },
    {
      title: "Resolved",
      value: resolvedIssues.toString(),
      change: "Fixed issues",
      icon: CheckCircle,
      bgColor: "bg-green-50",
      iconBg: "bg-green-500",
      textColor: "text-green-600"
    },
    {
      title: "Pending",
      value: pendingIssues.toString(),
      change: "Under review",
      icon: Clock,
      bgColor: "bg-orange-50",
      iconBg: "bg-orange-500",
      textColor: "text-orange-600"
    }
  ];

  return (
    <RoleGuard allowedRoles={['user']}>
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Report an Issue</h1>
            <p className="text-sm text-gray-600">Report bugs, request features, or get help</p>
          </div>
        </div>

        {/* Top Row - Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {metrics.map((metric, index) => (
            <Card
              key={index}
              className={`${metric.bgColor} border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer group`}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 ${metric.iconBg} rounded-lg flex items-center justify-center shadow-sm flex-shrink-0 group-hover:scale-110 transition-all duration-300`}>
                    <metric.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-900 truncate">{metric.title}</p>
                    <p className={`text-xl font-bold ${metric.textColor}`}>{metric.value}</p>
                    <p className="text-xs text-gray-600">{metric.change}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Report Form */}
          <Card className="bg-white rounded-2xl shadow-sm border-0">
            <CardHeader className="p-6 pb-4">
              <CardTitle className="text-xl font-bold text-gray-900">Submit New Issue</CardTitle>
              <p className="text-sm text-gray-600">Help us improve by reporting issues</p>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Issue Submitted Successfully!</h3>
                  <p className="text-gray-600">Thank you for your feedback. We&apos;ll review your issue soon.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-center">
                        <XCircle className="w-4 h-4 text-red-600 mr-2" />
                        <p className="text-red-800 text-sm">{error}</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Issue Type
                    </label>
                    <Select value={issueType} onValueChange={setIssueType}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select the type of issue" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bug">Bug Report</SelectItem>
                        <SelectItem value="feature">Feature Request</SelectItem>
                        <SelectItem value="question">Question</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Priority Level
                    </label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="How urgent is this issue?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low - Can wait</SelectItem>
                        <SelectItem value="medium">Medium - Normal priority</SelectItem>
                        <SelectItem value="high">High - Important</SelectItem>
                        <SelectItem value="urgent">Urgent - Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Issue Description
                    </label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Please provide a detailed description of the issue..."
                      className="min-h-[120px] resize-none"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Be as specific as possible.</p>
                  </div>

                  <Button
                    type="submit"
                    disabled={!issueType || !description || isSubmitting}
                    className="w-full bg-[#5A5BD8] hover:bg-[#5A5BD8]/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Issue Report
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Recent Issues */}
          <Card className="bg-white rounded-2xl shadow-sm border-0">
            <CardHeader className="p-6 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900">Your Recent Issues</CardTitle>
                  <p className="text-sm text-gray-600">Track your submitted issues</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{userIssues.length}</div>
                  <div className="text-xs text-gray-600">Total</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="space-y-3">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-gray-600 text-sm">Loading your issues...</p>
                  </div>
                ) : userIssues.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Bug className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">No Issues Reported Yet</h3>
                    <p className="text-sm text-gray-600">Your submitted issues will appear here.</p>
                  </div>
                ) : (
                  userIssues.map((issue) => (
                    <div key={issue.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-md transition-all duration-300 bg-white">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="text-sm font-bold text-gray-900 capitalize">{issue.type.replace('_', ' ')}</h4>
                            <span className="text-xs text-gray-500">#{issue.id.slice(0, 8)}</span>
                          </div>

                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded ${getStatusColor(issue.status)}`}>
                              {issue.status.replace('_', ' ').toUpperCase()}
                            </span>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded ${getPriorityColor(issue.priority)}`}>
                              {issue.priority.toUpperCase()}
                            </span>
                          </div>

                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">{issue.description}</p>

                          <div className="flex items-center text-xs text-gray-500">
                            <Clock className="w-3 h-3 mr-1" />
                            <span>{new Date(issue.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleGuard>
  );
};

export default ReportIssuePage;
