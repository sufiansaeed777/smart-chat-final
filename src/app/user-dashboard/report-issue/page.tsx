'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Send, CheckCircle, Clock, XCircle, Bug, MessageSquare, FileText, PlusCircle, Zap, Shield, Users, Star } from 'lucide-react';
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
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };


  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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

  return (
    <RoleGuard allowedRoles={['user']}>
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        {/* Header */}
        <div className="container mx-auto px-6 pt-8 pb-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <div>
                <h1 className="text-3xl font-bold text-gray-900">Report an Issue</h1>
                <p className="text-lg text-gray-600">Report bugs, request features, or get help with your chatbot</p>
              </div>
            </div>
          </div>
        </div>

        {/* Issue Stats */}
        <div className="container mx-auto px-6 mb-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-blue-50 border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                      <FileText className="w-5 h-5 text-white" />
                </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-900 truncate">Total Issues</p>
                      <p className="text-xl font-bold text-blue-600">{totalIssues}</p>
                      <p className="text-xs text-gray-600 mt-1">All time</p>
                </div>
              </div>
            </CardContent>
          </Card>

              <Card className="bg-green-50 border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-white" />
                </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-900 truncate">Resolved</p>
                      <p className="text-xl font-bold text-green-600">{resolvedIssues}</p>
                      <p className="text-xs text-gray-600 mt-1">Fixed issues</p>
                </div>
              </div>
            </CardContent>
          </Card>

              <Card className="bg-orange-50 border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                      <Clock className="w-5 h-5 text-white" />
                </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-900 truncate">Pending</p>
                      <p className="text-xl font-bold text-orange-600">{pendingIssues}</p>
                      <p className="text-xs text-gray-600 mt-1">Under review</p>
                </div>
              </div>
            </CardContent>
          </Card>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 pb-12">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Report Form */}
              <Card className="bg-white rounded-3xl shadow-xl border-0 overflow-hidden hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 group">
                <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-8 group-hover:from-blue-700 group-hover:via-purple-700 group-hover:to-indigo-700 transition-all duration-300">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg group-hover:bg-white/30 group-hover:scale-110 transition-all duration-300">
                      <PlusCircle className="w-7 h-7 text-white group-hover:rotate-90 transition-transform duration-300" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold text-white mb-2">Submit New Issue</CardTitle>
                      <p className="text-blue-100 text-base">Help us improve by reporting issues and bugs</p>
                    </div>
                  </div>
                </div>
                <CardContent className="p-8">
              {submitted ? (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">Issue Submitted Successfully!</h3>
                      <p className="text-gray-600 text-lg">Thank you for your feedback. We&apos;ll review your issue and get back to you soon.</p>
                </div>
              ) : (
                    <form onSubmit={handleSubmit} className="space-y-8">
                  {error && (
                        <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-4">
                      <div className="flex items-center">
                            <XCircle className="w-5 h-5 text-red-400 mr-3" />
                            <p className="text-red-800 text-sm font-medium">{error}</p>
                      </div>
                    </div>
                  )}
                      
                      <div className="space-y-6">
                  <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Issue Type
                    </label>
                    <Select value={issueType} onValueChange={setIssueType}>
                            <SelectTrigger className="w-full h-14 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-300 hover:bg-gray-100 transition-all duration-200">
                              <SelectValue placeholder="Select the type of issue" />
                      </SelectTrigger>
                      <SelectContent>
                              <SelectItem value="bug">🐛 Bug Report</SelectItem>
                              <SelectItem value="feature">✨ Feature Request</SelectItem>
                              <SelectItem value="question">❓ Question</SelectItem>
                              <SelectItem value="other">📝 Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-3">
                            Priority Level
                    </label>
                    <Select value={priority} onValueChange={setPriority}>
                            <SelectTrigger className="w-full h-14 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-300 hover:bg-gray-100 transition-all duration-200">
                              <SelectValue placeholder="How urgent is this issue?" />
                      </SelectTrigger>
                      <SelectContent>
                              <SelectItem value="low">🟢 Low - Can wait</SelectItem>
                              <SelectItem value="medium">🟡 Medium - Normal priority</SelectItem>
                              <SelectItem value="high">🟠 High - Important</SelectItem>
                              <SelectItem value="urgent">🔴 Urgent - Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-3">
                            Issue Description
                    </label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                            placeholder="Please provide a detailed description of the issue, including steps to reproduce if applicable..."
                            className="min-h-[140px] bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-300 hover:bg-gray-100 transition-all duration-200 resize-none"
                      required
                    />
                          <p className="text-xs text-gray-500 mt-2">Be as specific as possible to help us resolve your issue quickly.</p>
                        </div>
                  </div>

                      <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={!issueType || !description || isSubmitting}
                          className="w-full h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                              Submitting Issue...
                      </>
                    ) : (
                      <>
                              <Send className="w-5 h-5 mr-3" />
                              Submit Issue Report
                      </>
                    )}
                  </Button>
                      </div>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Recent Issues */}
              <Card className="bg-white rounded-3xl shadow-xl border-0 overflow-hidden hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 group">
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 group-hover:from-indigo-700 group-hover:via-purple-700 group-hover:to-pink-700 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg group-hover:bg-white/30 group-hover:scale-110 transition-all duration-300">
                        <MessageSquare className="w-7 h-7 text-white group-hover:rotate-12 transition-transform duration-300" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-bold text-white mb-2">Your Recent Issues</CardTitle>
                        <p className="text-indigo-100 text-base">Track your submitted issues and their status</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-white group-hover:scale-110 transition-transform duration-300">{userIssues.length}</div>
                      <div className="text-indigo-100 text-sm">Total Issues</div>
                    </div>
                  </div>
                </div>
                <CardContent className="p-8">
                  <div className="space-y-6">
                {loading ? (
                      <div className="text-center py-12">
                        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-6"></div>
                        <p className="text-gray-600 text-lg">Loading your issues...</p>
                  </div>
                ) : userIssues.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                          <Bug className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Issues Reported Yet</h3>
                        <p className="text-gray-600">When you submit an issue, it will appear here for tracking.</p>
                  </div>
                ) : (
                  userIssues.map((issue) => (
                        <div key={issue.id} className="group border-2 border-gray-100 rounded-2xl p-6 hover:border-indigo-200 hover:shadow-xl transition-all duration-300 bg-white hover:bg-gradient-to-br hover:from-indigo-50/50 hover:to-purple-50/50 relative overflow-hidden">
                          {/* Subtle gradient overlay on hover */}
                          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          
                          <div className="relative z-10">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-3">
                                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center group-hover:from-indigo-200 group-hover:to-purple-200 transition-all duration-200">
                                    <AlertTriangle className="w-5 h-5 text-indigo-600 group-hover:text-indigo-700" />
                                  </div>
                                  <div>
                                    <h4 className="text-lg font-bold text-gray-900 capitalize group-hover:text-indigo-600 transition-colors duration-200">{issue.type.replace('_', ' ')}</h4>
                                    <p className="text-xs text-gray-500">Issue #{issue.id.slice(0, 8)}</p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-2 mb-3">
                                  <span className={`px-3 py-1.5 text-xs font-semibold rounded-full border ${getStatusColor(issue.status)} group-hover:scale-105 transition-transform duration-200 shadow-sm`}>
                                    {issue.status.replace('_', ' ').toUpperCase()}
                          </span>
                                  <span className={`px-3 py-1.5 text-xs font-semibold rounded-full border ${getPriorityColor(issue.priority)} group-hover:scale-105 transition-transform duration-200 shadow-sm`}>
                                    {issue.priority.toUpperCase()}
                          </span>
                                </div>
                                
                                <p className="text-gray-600 leading-relaxed line-clamp-3 mb-4 group-hover:text-gray-700 transition-colors duration-200">{issue.description}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between pt-4 border-t border-gray-100 group-hover:border-indigo-200 transition-colors duration-200">
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center text-sm text-gray-500 group-hover:text-indigo-600 transition-colors duration-200">
                                  <Clock className="w-4 h-4 mr-2" />
                                  <span className="font-medium">{new Date(issue.createdAt).toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })}</span>
                                </div>
                                <div className="w-2 h-2 bg-gray-300 rounded-full group-hover:bg-indigo-400 group-hover:scale-125 transition-all duration-200"></div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="text-xs text-gray-400 group-hover:text-indigo-500 transition-colors duration-200 font-mono">
                                  #{issue.id.slice(0, 8)}
                                </div>
                                <div className="w-1 h-1 bg-gray-300 rounded-full group-hover:bg-indigo-400 transition-colors duration-200"></div>
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
        </div>

        {/* Lightning-Fast Issue Resolution Section */}
        <div className="container mx-auto px-6 pb-16">
          <div className="max-w-7xl mx-auto">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 rounded-3xl shadow-2xl">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  backgroundRepeat: 'repeat'
                }}></div>
              </div>
              
              {/* Content */}
              <div className="relative px-8 py-16 md:px-12 md:py-20">
                <div className="max-w-4xl mx-auto text-center">
                  {/* Icon with animated background */}
                  <div className="relative inline-block mb-8">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-xl opacity-75 animate-pulse"></div>
                    <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-4 shadow-2xl">
                      <Zap className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  
                  <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                    Lightning-Fast Issue Resolution
                  </h2>
                  <p className="text-xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed">
                    We understand that every minute counts. Our dedicated support team works around the clock 
                    to resolve your issues quickly and efficiently, ensuring minimal disruption to your workflow.
                  </p>
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Quick Response */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                <div className="relative bg-white rounded-2xl p-8 shadow-xl border border-gray-100 group-hover:shadow-2xl transition-all duration-300 group-hover:-translate-y-2">
                  <div className="flex items-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Clock className="w-8 h-8 text-white" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-2xl font-bold text-gray-900">Quick Response</h3>
                      <div className="w-12 h-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mt-2"></div>
                    </div>
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    Average response time of <span className="font-bold text-green-600 text-lg">under 2 hours</span> 
                    for urgent issues, with most resolved within 24 hours.
                  </p>
                </div>
              </div>

              {/* Expert Team */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                <div className="relative bg-white rounded-2xl p-8 shadow-xl border border-gray-100 group-hover:shadow-2xl transition-all duration-300 group-hover:-translate-y-2">
                  <div className="flex items-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Users className="w-8 h-8 text-white" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-2xl font-bold text-gray-900">Expert Team</h3>
                      <div className="w-12 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mt-2"></div>
                    </div>
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    Our <span className="font-bold text-purple-600 text-lg">certified specialists</span> 
                    have deep expertise in chatbot technologies and AI systems.
                  </p>
                </div>
              </div>

              {/* 24/7 Support */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                <div className="relative bg-white rounded-2xl p-8 shadow-xl border border-gray-100 group-hover:shadow-2xl transition-all duration-300 group-hover:-translate-y-2">
                  <div className="flex items-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Shield className="w-8 h-8 text-white" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-2xl font-bold text-gray-900">24/7 Support</h3>
                      <div className="w-12 h-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-full mt-2"></div>
                    </div>
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    Round-the-clock monitoring and support to ensure your chatbots 
                    are <span className="font-bold text-orange-600 text-lg">always running smoothly</span>.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </RoleGuard>
  );
};

export default ReportIssuePage;
