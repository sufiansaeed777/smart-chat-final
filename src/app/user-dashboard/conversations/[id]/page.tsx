'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Bot, User as UserIcon, Download, Loader2, MessageSquare, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
  botId: string;
  botName: string;
  guestName?: string;
  guestId?: string;
  mode?: string;
  status?: string;
  source?: string;
  messages: Message[];
}

const UserConversationDetailsPage = () => {
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
      const response = await fetch(`/api/user/conversations/${conversationId}`);

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
      const response = await fetch(`/api/user/conversations/${conversationId}/export`);
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

  const formatTime = (timeString: string) => {
    if (!timeString) return 'Unknown time';

    const date = new Date(timeString);

    if (isNaN(date.getTime())) {
      return 'Unknown time';
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const isToday = today.getTime() === messageDay.getTime();

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = yesterday.getTime() === messageDay.getTime();

    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    if (isToday) {
      return timeStr;
    } else if (isYesterday) {
      return `Yesterday, ${timeStr}`;
    } else {
      const dateStr = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
      return `${dateStr}, ${timeStr}`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <RoleGuard allowedRoles={['user']}>
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
      <RoleGuard allowedRoles={['user']}>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Conversation</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button
                onClick={() => router.push('/user-dashboard/conversations')}
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
    <RoleGuard allowedRoles={['user']}>
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.push('/user-dashboard/conversations')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-gray-900">Conversation Details</h1>
                {conversation.source === 'wordpress' && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    <Globe className="w-3 h-3 mr-1" />
                    Website
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600">
                {conversation.botName}
                {conversation.guestName && ` • ${conversation.guestName}`}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {conversation.status && (
              <Badge className={`${getStatusColor(conversation.status)} px-3 py-1`}>
                {conversation.status}
              </Badge>
            )}
            <Button
              onClick={handleExport}
              className="flex items-center space-x-2 bg-[#6566F1] hover:bg-[#5A5BD8] text-white"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </Button>
          </div>
        </div>

        {/* Conversation Info */}
        {(conversation.mode || conversation.guestId) && (
          <Card className="bg-white border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-6 text-sm">
                {conversation.mode && (
                  <div>
                    <span className="text-gray-500">Mode:</span>
                    <span className="ml-2 font-medium text-gray-900">{conversation.mode}</span>
                  </div>
                )}
                {conversation.guestId && (
                  <div>
                    <span className="text-gray-500">Visitor ID:</span>
                    <span className="ml-2 font-medium text-gray-900">{conversation.guestId}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-500">Messages:</span>
                  <span className="ml-2 font-medium text-gray-900">{conversation.messages.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Messages */}
        <Card className="bg-white">
          <CardContent className="p-6">
            <div className="space-y-4">
              {conversation.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' || message.sender === 'visitor' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-3 max-w-[80%] ${message.sender === 'user' || message.sender === 'visitor' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.sender === 'user' || message.sender === 'visitor'
                        ? 'bg-[#6566F1] text-white'
                        : message.sender === 'agent'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {message.sender === 'user' || message.sender === 'visitor' ? (
                        <UserIcon className="w-4 h-4" />
                      ) : message.sender === 'agent' ? (
                        <UserIcon className="w-4 h-4" />
                      ) : (
                        <Bot className="w-4 h-4" />
                      )}
                    </div>

                    {/* Message */}
                    <div className="flex-1">
                      <div className={`rounded-2xl px-4 py-2 ${
                        message.sender === 'user' || message.sender === 'visitor'
                          ? 'bg-[#6566F1] text-white'
                          : message.sender === 'agent'
                          ? 'bg-green-100 text-gray-900'
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 px-2">
                        {formatTime(message.timestamp)}
                        {message.isTestMessage && ' • Test Message'}
                        {message.sender === 'agent' && ' • Agent'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
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

export default UserConversationDetailsPage;
