'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Bot, User as UserIcon, Download, Loader2, MessageSquare,
  Globe, Flag, Clock, MapPin, Mail, Link as LinkIcon, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import RoleGuard from '@/components/auth/RoleGuard';

interface Message {
  id: string;
  message: string;
  sender: 'user' | 'bot' | 'agent' | 'visitor';
  timestamp: string;
  isTestMessage: boolean;
}

interface ConversationDetails {
  id: string;
  sessionId?: string;
  botId?: string;
  botName?: string;
  userId?: string;
  guestName?: string;
  guestId?: string;
  visitorEmail?: string;
  pageUrl?: string;
  country?: string;
  ipAddress?: string;
  mode?: string;
  status?: string;
  source?: string;
  isFlagged?: boolean;
  flagReason?: string;
  reviewStatus?: string;
  assignedAgent?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt?: string;
  messages: Message[];
}

const AdminConversationDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;

  const [conversation, setConversation] = useState<ConversationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConversationDetails();
  }, [conversationId]);

  const fetchConversationDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/conversations/${conversationId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch conversation details');
      }

      const data = await response.json();
      setConversation(data.conversation);
    } catch (err) {
      console.error('Error fetching conversation details:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch conversation details');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/admin/conversations/${conversationId}`);
      if (response.ok) {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `conversation-${conversationId}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        alert('Failed to export conversation');
      }
    } catch (error) {
      console.error('Error exporting conversation:', error);
      alert('Error exporting conversation');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/conversations/${conversationId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Conversation deleted successfully');
        router.push('/admin-dashboard/conversations');
      } else {
        alert('Failed to delete conversation');
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert('Error deleting conversation');
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return 'Unknown time';

    const date = new Date(timeString);

    if (isNaN(date.getTime())) {
      return 'Unknown time';
    }

    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };

    return date.toLocaleDateString('en-US', options).replace(',', ' at');
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <RoleGuard allowedRoles={['admin']}>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#6566F1] mx-auto mb-4" />
              <p className="text-gray-600">Loading conversation...</p>
            </div>
          </div>
        </div>
      </RoleGuard>
    );
  }

  if (error || !conversation) {
    return (
      <RoleGuard allowedRoles={['admin']}>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Conversation</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button
                onClick={() => router.push('/admin-dashboard/conversations')}
                className="bg-[#6566F1] hover:bg-[#5A5BD8] text-white"
              >
                Back to Conversations
              </Button>
            </div>
          </div>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.push('/admin-dashboard/conversations')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">Conversation Details</h1>
                {conversation.isFlagged && (
                  <Badge className="bg-red-100 text-red-800">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Flagged
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600">View the complete conversation history</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleExport}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </Button>
            <Button
              onClick={handleDelete}
              variant="destructive"
              className="flex items-center space-x-2"
            >
              <span>Delete</span>
            </Button>
          </div>
        </div>

        {/* Conversation Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Visitor Info */}
          <Card className="bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <UserIcon className="w-4 h-4" />
                Visitor Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Name</span>
                <span className="text-sm font-medium">{conversation.guestName || 'Unknown'}</span>
              </div>
              {conversation.visitorEmail && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    Email
                  </span>
                  <span className="text-sm">{conversation.visitorEmail}</span>
                </div>
              )}
              {conversation.country && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Country
                  </span>
                  <span className="text-sm">{conversation.country}</span>
                </div>
              )}
              {conversation.ipAddress && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">IP Address</span>
                  <span className="text-sm font-mono">{conversation.ipAddress}</span>
                </div>
              )}
              {conversation.pageUrl && (
                <div className="flex items-start justify-between">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <LinkIcon className="w-3 h-3" />
                    Page URL
                  </span>
                  <a
                    href={conversation.pageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline truncate max-w-[200px]"
                  >
                    {conversation.pageUrl}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bot Info */}
          <Card className="bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Bot className="w-4 h-4" />
                Bot Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Bot Name</span>
                <span className="text-sm font-medium">{conversation.botName || 'Unknown'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Source</span>
                <Badge className={conversation.source === 'wordpress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}>
                  {conversation.source === 'wordpress' ? (
                    <>
                      <Globe className="w-3 h-3 mr-1" />
                      Website
                    </>
                  ) : 'Playground'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Mode</span>
                <Badge className={conversation.mode === 'Human' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}>
                  {conversation.mode || 'AI'}
                </Badge>
              </div>
              {conversation.assignedAgent && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Assigned Agent</span>
                  <span className="text-sm">{conversation.assignedAgent.name}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Session Info */}
          <Card className="bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Session Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Status</span>
                <Badge className={getStatusColor(conversation.status)}>
                  {conversation.status || 'Unknown'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Messages</span>
                <span className="text-sm font-medium">{conversation.messages.length}</span>
              </div>
              {conversation.createdAt && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Started</span>
                  <span className="text-sm">{formatTime(conversation.createdAt)}</span>
                </div>
              )}
              {conversation.sessionId && (
                <div className="flex items-start justify-between">
                  <span className="text-xs text-gray-500">Session ID</span>
                  <span className="text-xs font-mono text-gray-600 truncate max-w-[150px]">
                    {conversation.sessionId}
                  </span>
                </div>
              )}
              {conversation.isFlagged && conversation.flagReason && (
                <div className="pt-2 border-t">
                  <span className="text-xs text-red-600 font-medium">Flag Reason:</span>
                  <p className="text-sm text-gray-700 mt-1">{conversation.flagReason}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Messages */}
        <Card className="bg-white">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Conversation ({conversation.messages.length} messages)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {conversation.messages.map((message) => {
                const isUser = message.sender === 'user' || message.sender === 'visitor';
                const isAgent = message.sender === 'agent';

                return (
                  <div
                    key={message.id}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start space-x-3 max-w-[80%] ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isUser
                          ? 'bg-[#6566F1] text-white'
                          : isAgent
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-200 text-gray-600'
                      }`}>
                        {isUser ? (
                          <UserIcon className="w-4 h-4" />
                        ) : isAgent ? (
                          <UserIcon className="w-4 h-4" />
                        ) : (
                          <Bot className="w-4 h-4" />
                        )}
                      </div>

                      {/* Message */}
                      <div className="flex-1">
                        <div className={`rounded-2xl px-4 py-2 ${
                          isUser
                            ? 'bg-[#6566F1] text-white'
                            : isAgent
                              ? 'bg-purple-100 text-gray-900'
                              : 'bg-gray-100 text-gray-900'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 px-2">
                          {formatTime(message.timestamp)}
                          {message.isTestMessage && ' (Test)'}
                          {isAgent && ' (Agent)'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {conversation.messages.length === 0 && (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No messages in this conversation</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
};

export default AdminConversationDetailsPage;
