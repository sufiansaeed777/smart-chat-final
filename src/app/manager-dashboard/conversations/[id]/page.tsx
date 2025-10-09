'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Bot, User as UserIcon, Download, Loader2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import RoleGuard from '@/components/auth/RoleGuard';

interface Message {
  id: string;
  message: string;
  sender: 'user' | 'bot';
  timestamp: string;
  isTestMessage: boolean;
}

interface ConversationDetails {
  id: string;
  messages: Message[];
}

const ConversationDetailsPage = () => {
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
      const response = await fetch(`/api/manager/conversations/${conversationId}`);

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
      const response = await fetch(`/api/manager/conversations/${conversationId}/export`);
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
    return new Date(timeString).toLocaleString();
  };

  if (loading) {
    return (
      <RoleGuard allowedRoles={['manager']}>
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
      <RoleGuard allowedRoles={['manager']}>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Conversation</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button
                onClick={() => router.push('/manager-dashboard/conversations')}
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
    <RoleGuard allowedRoles={['manager']}>
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.push('/manager-dashboard/conversations')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Conversation Details</h1>
              <p className="text-sm text-gray-600">View the complete conversation history</p>
            </div>
          </div>
          <Button
            onClick={handleExport}
            className="flex items-center space-x-2 bg-[#6566F1] hover:bg-[#5A5BD8] text-white"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </Button>
        </div>

        {/* Messages */}
        <Card className="bg-white">
          <CardContent className="p-6">
            <div className="space-y-4">
              {conversation.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-3 max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.sender === 'user'
                        ? 'bg-[#6566F1] text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {message.sender === 'user' ? (
                        <UserIcon className="w-4 h-4" />
                      ) : (
                        <Bot className="w-4 h-4" />
                      )}
                    </div>

                    {/* Message */}
                    <div className="flex-1">
                      <div className={`rounded-2xl px-4 py-2 ${
                        message.sender === 'user'
                          ? 'bg-[#6566F1] text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 px-2">
                        {formatTime(message.timestamp)}
                        {message.isTestMessage && ' • Test Message'}
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

export default ConversationDetailsPage;
