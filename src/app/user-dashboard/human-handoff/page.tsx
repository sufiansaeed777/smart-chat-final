'use client';

import React, { useState, useEffect } from 'react';
import { 
  HandHeart, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  User, 
  MessageCircle,
  RefreshCw,
  Users,
  ChevronDown,
  ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import RoleGuard from '@/components/auth/RoleGuard';
import ProfessionalSpinner from '@/components/ui/ProfessionalSpinner';

interface HandoffRequest {
  id: string;
  customer: string;
  issue: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  time: string;
  lastMessage: string;
  agent?: string;
  createdAt: string;
  botName: string;
}

interface ConversationMessage {
  sender: string;
  message: string;
  time: string;
  isBot: boolean;
}

const UserHumanHandoffPage = () => {
  const [selectedRequest, setSelectedRequest] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Mock data for user's handoff requests
  const [handoffRequests] = useState<HandoffRequest[]>([
    {
      id: '1',
      customer: 'John Doe',
      issue: 'Payment not processing',
      status: 'pending',
      priority: 'high',
      time: '3 minutes',
      lastMessage: 'Customer needs assistance with payment processing...',
      createdAt: '2024-01-22T10:30:00Z',
      botName: 'Support Bot'
    },
    {
      id: '2',
      customer: 'Jane Smith',
      issue: 'Technical support needed',
      status: 'in_progress',
      priority: 'medium',
      time: '0 minutes',
      lastMessage: 'You are currently assisting this customer',
      agent: 'Sarah Chen',
      createdAt: '2024-01-22T09:15:00Z',
      botName: 'Tech Bot'
    }
  ]);

  // Mock conversation history
  const conversationHistory: ConversationMessage[] = [
    {
      sender: 'Bot',
      message: 'Hi there! What technical issue can I help you with?',
      time: '10:25 AM',
      isBot: true
    },
    {
      sender: 'John Doe',
      message: 'My payment is not going through and I need immediate help',
      time: '10:26 AM',
      isBot: false
    },
    {
      sender: 'Bot',
      message: 'I understand you\'re having payment issues. Let me transfer you to a human agent who can help with this immediately.',
      time: '10:27 AM',
      isBot: true
    },
    {
      sender: 'System',
      message: 'Customer has been transferred to human agent. You can now take over this conversation.',
      time: '10:28 AM',
      isBot: true
    }
  ];

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-orange-500';
      case 'in_progress': return 'text-blue-500';
      case 'resolved': return 'text-green-500';
      case 'closed': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'in_progress': return <RefreshCw className="w-4 h-4" />;
      case 'resolved': return <CheckCircle className="w-4 h-4" />;
      case 'closed': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-red-500 text-white';
      case 'medium': return 'bg-blue-500 text-white';
      case 'low': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const selectedRequestData = handoffRequests[selectedRequest];

  if (loading) {
    return (
      <RoleGuard allowedRoles={['user']}>
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <div className="bg-white p-6 rounded-2xl">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="space-y-4">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="h-20 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="lg:col-span-2">
                <div className="bg-white p-6 rounded-2xl">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-32 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={['user']}>
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        {/* Header */}
        <div className="container mx-auto px-6 pt-8 pb-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Dashboard</span>
                </button>
              </div>
            </div>

            {/* Page Title */}
            <div className="mt-6">
              <h1 className="text-3xl font-bold text-gray-900">Human Handoff Queue</h1>
              <p className="text-lg text-gray-600 mt-2">Take over AI chatbot conversations that require human assistance.</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="container mx-auto px-6 mb-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-blue-50 border border-gray-200 rounded-xl shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300 overflow-hidden group">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                      <HandHeart className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-900 truncate">Total Handoffs</p>
                      <p className="text-xl font-bold text-blue-600">{handoffRequests.length}</p>
                      <p className="text-xs text-gray-600 mt-1">All time</p>
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
                      <p className="text-xl font-bold text-orange-600">
                        {handoffRequests.filter(req => req.status === 'pending').length}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">Awaiting you</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-purple-50 border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                      <RefreshCw className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-900 truncate">In Progress</p>
                      <p className="text-xl font-bold text-purple-600">
                        {handoffRequests.filter(req => req.status === 'in_progress').length}
                      </p>
                        <p className="text-xs text-gray-600 mt-1">You&apos;re handling</p>
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
                      <p className="text-xl font-bold text-green-600">
                        {handoffRequests.filter(req => req.status === 'resolved').length}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">Completed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="container mx-auto px-6 pb-12">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Panel - Handoff Requests */}
              <div className="lg:col-span-1">
                <Card className="bg-white rounded-2xl shadow-lg border border-gray-200">
                  <CardHeader className="p-6 pb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                        <HandHeart className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold text-gray-900">Handoff Queue</CardTitle>
                        <p className="text-sm text-gray-600">Take over conversations from AI bots</p>
                      </div>
                    </div>
                  </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="space-y-4">
                  {handoffRequests.map((request, index) => (
                    <div 
                      key={request.id}
                      className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer hover:shadow-md ${
                        selectedRequest === index 
                          ? 'border-[#6566F1] bg-[#6566F1]/10' 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedRequest(index)}
                    >
                      <div className="space-y-3">
                        {/* Customer and Issue */}
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">{request.customer}</h3>
                          <p className="text-xs text-gray-600">{request.issue}</p>
                          <p className="text-xs text-gray-500">Bot: {request.botName}</p>
                        </div>

                        {/* Status and Priority */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(request.status)}
                            <span className={`text-xs font-medium ${getStatusColor(request.status)}`}>
                              {request.status.replace('_', ' ')}
                            </span>
                            <span className="text-xs text-gray-500">{request.time}</span>
                          </div>
                          <Badge className={`text-xs ${getPriorityColor(request.priority)}`}>
                            {request.priority}
                          </Badge>
                        </div>

                        {/* Agent Assignment (if in progress) */}
                        {request.agent && (
                          <div className="text-xs text-gray-600">
                            Assigned to: {request.agent}
                          </div>
                        )}

                        {/* Last Message */}
                        <div className="text-xs text-gray-500">
                          {request.lastMessage}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

              {/* Right Panel - Request Details */}
              <div className="lg:col-span-2">
                <Card className="bg-white rounded-2xl shadow-lg border border-gray-200">
                  <CardContent className="p-6">
                {/* Request Info */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <HandHeart className="w-5 h-5 text-gray-600" />
                      <h2 className="text-lg font-bold text-gray-900">{selectedRequestData.customer}</h2>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={`${getPriorityColor(selectedRequestData.priority)}`}>
                        {selectedRequestData.priority} priority
                      </Badge>
                      <Badge className="bg-gray-100 text-gray-600">
                        {selectedRequestData.botName}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{selectedRequestData.customer.toLowerCase().replace(' ', '.')}@email.com</p>
                </div>

                {/* Summary */}
                <div className="flex items-center space-x-6 mb-6">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Wait time: {selectedRequestData.time}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Issue: {selectedRequestData.issue}</span>
                  </div>
                </div>

                {/* Status Information */}
                <div className="mb-6">
                  <h3 className="text-base font-semibold text-gray-900 mb-2">Handoff Status</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      {getStatusIcon(selectedRequestData.status)}
                      <span className={`font-medium ${getStatusColor(selectedRequestData.status)}`}>
                        {selectedRequestData.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    {selectedRequestData.status === 'pending' && (
                      <p className="text-sm text-gray-600">
                        This conversation is waiting for you to take over from the AI bot.
                      </p>
                    )}
                    {selectedRequestData.status === 'in_progress' && selectedRequestData.agent && (
                      <p className="text-sm text-gray-600">
                        You are currently handling this conversation with the customer.
                      </p>
                    )}
                    {selectedRequestData.status === 'resolved' && (
                      <p className="text-sm text-gray-600">
                        This conversation has been successfully resolved and closed.
                      </p>
                    )}
                  </div>
                </div>

                {/* Conversation History */}
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">Conversation History</h3>
                  <p className="text-sm text-gray-600 mb-4">Review the AI bot&apos;s conversation with the customer before taking over.</p>
                  
                  <div className="space-y-4 max-h-64 overflow-y-auto">
                    {conversationHistory.map((message, index) => (
                      <div key={index} className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                          message.isBot 
                            ? 'bg-gray-100 text-gray-900' 
                            : 'bg-[#6566F1] text-white'
                        }`}>
                          <div className="flex items-start space-x-2">
                            {message.isBot ? (
                              <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-gray-600">B</span>
                              </div>
                            ) : (
                              <div className="w-6 h-6 bg-[#6566F1] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-white">U</span>
                              </div>
                            )}
                            <div className="flex-1">
                              <p className="text-sm">{message.message}</p>
                              <p className={`text-xs mt-1 ${
                                message.isBot ? 'text-gray-500' : 'text-white/70'
                              }`}>
                                {message.sender} • {message.time}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
};

export default UserHumanHandoffPage;
