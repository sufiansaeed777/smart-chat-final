'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MessageCircle,
  Send,
  CheckCircle2,
  User,
  Bot,
  Clock,
  RefreshCw
} from 'lucide-react';

interface Message {
  id: string;
  sender: 'visitor' | 'agent' | 'bot';
  text: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  guestName: string;
  guestId: string;
  mode: 'AI' | 'Human';
  status: 'active' | 'waiting' | 'idle' | 'completed';
  lastMessage: string;
  timestamp: string;
  messages: Message[];
}

const HumanHandoff = () => {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [completedConversations, setCompletedConversations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pauseAutoRefresh, setPauseAutoRefresh] = useState(false);
  const [userBots, setUserBots] = useState<any[]>([]);
  const [selectedBotId, setSelectedBotId] = useState<string | null>(null);

  // Fetch user's bots (manager can have multiple bots, 1 per site)
  const fetchUserBots = async () => {
    try {
      const response = await fetch('/api/manager/bots');
      if (response.ok) {
        const data = await response.json();
        const bots = data.bots || [];
        setUserBots(bots);
        // Auto-select first bot if available
        if (bots.length > 0 && !selectedBotId) {
          setSelectedBotId(bots[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching user bots:', error);
    }
  };

  // Fetch conversations from API
  const fetchConversations = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) setIsRefreshing(true);

      // Build URL with botId filter if available
      const url = selectedBotId
        ? `/api/conversations?botId=${selectedBotId}`
        : '/api/conversations';

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setConversations(data.conversations);

        // Auto-select first conversation with messages if none selected (only on initial load)
        setSelectedConversationId(prevId => {
          if (!prevId && data.conversations.length > 0) {
            // Find first conversation with messages
            const firstActiveConv = data.conversations.find(conv => conv.messages && conv.messages.length > 0);
            return firstActiveConv ? firstActiveConv.id : null;
          }
          return prevId;
        });
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoading(false);
      if (showRefreshIndicator) setIsRefreshing(false);
    }
  };

  // Fetch completed conversations
  const fetchCompletedConversations = async () => {
    try {
      // Build URL with botId filter if available
      const url = selectedBotId
        ? `/api/conversations?status=completed&botId=${selectedBotId}`
        : '/api/conversations?status=completed';

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setCompletedConversations(data.conversations.map((conv: any) => ({
          id: conv.id,
          name: conv.guestName,
          guestId: conv.guestId,
          note: conv.lastMessage,
          timestamp: conv.timestamp,
          resolved: true
        })));
      }
    } catch (error) {
      console.error('Error fetching completed conversations:', error);
    }
  };

  // Initial load - fetch bots first
  useEffect(() => {
    fetchUserBots();
  }, []);

  // When bot is selected, fetch conversations
  useEffect(() => {
    if (selectedBotId) {
      // Clear selected conversation when switching bots
      setSelectedConversationId(null);
      setMessageInput('');

      fetchConversations();
      fetchCompletedConversations();
    }
  }, [selectedBotId]);

  // Auto-refresh every 5 seconds (but pause if manual action is in progress)
  useEffect(() => {
    if (!selectedBotId) return; // Don't start interval until bot is selected

    const interval = setInterval(() => {
      if (!pauseAutoRefresh) {
        fetchConversations(false); // Silent refresh
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [pauseAutoRefresh, selectedBotId]);

  const selectedConversation = conversations.find(conv => conv.id === selectedConversationId);

  // Filter out conversations with no messages (old test data)
  const activeConversations = conversations.filter(conv => conv.messages && conv.messages.length > 0);

  const handleSendMessage = async () => {
    if (messageInput.trim() && selectedConversation) {
      const messageText = messageInput;
      setMessageInput(''); // Clear input immediately

      try {
        const response = await fetch(`/api/conversations/${selectedConversation.id}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: messageText,
            sender: 'agent'
          })
        });

        const data = await response.json();

        if (data.success) {
          // Update local state with new message
          setConversations(prevConversations =>
            prevConversations.map(conv =>
              conv.id === selectedConversation.id
                ? { ...conv, messages: data.conversation.messages }
                : conv
            )
          );
        }
      } catch (error) {
        console.error('Error sending message:', error);
        // Restore message input on error
        setMessageInput(messageText);
      }
    }
  };

  const handleTakeOver = async () => {
    if (selectedConversation) {
      try {
        // Pause auto-refresh during manual action
        setPauseAutoRefresh(true);

        const response = await fetch(`/api/conversations/${selectedConversation.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'Human',
            message: "You're now talking to an Agent. I'm here to help!"
          })
        });

        const data = await response.json();

        if (data.success) {
          // Update local state
          setConversations(prevConversations =>
            prevConversations.map(conv =>
              conv.id === selectedConversation.id
                ? { ...conv, mode: 'Human', messages: data.conversation.messages }
                : conv
            )
          );

          // Resume auto-refresh after 3 seconds to ensure DB update has propagated
          setTimeout(() => {
            setPauseAutoRefresh(false);
          }, 3000);
        } else {
          setPauseAutoRefresh(false);
        }
      } catch (error) {
        console.error('Error taking over conversation:', error);
        setPauseAutoRefresh(false);
      }
    }
  };

  const handleReturnToAI = async () => {
    if (selectedConversation) {
      try {
        // Pause auto-refresh during manual action
        setPauseAutoRefresh(true);

        const response = await fetch(`/api/conversations/${selectedConversation.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'AI',
            message: "You're now talking to an AI. How can I help you?"
          })
        });

        const data = await response.json();

        if (data.success) {
          // Update local state
          setConversations(prevConversations =>
            prevConversations.map(conv =>
              conv.id === selectedConversation.id
                ? { ...conv, mode: 'AI', messages: data.conversation.messages }
                : conv
            )
          );

          // Resume auto-refresh after 3 seconds to ensure DB update has propagated
          setTimeout(() => {
            setPauseAutoRefresh(false);
          }, 3000);
        } else {
          setPauseAutoRefresh(false);
        }
      } catch (error) {
        console.error('Error returning to AI:', error);
        setPauseAutoRefresh(false);
      }
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-50">
      {/* Left Sidebar - Conversations List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">Agent Console</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => fetchConversations(true)}
                disabled={isRefreshing}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                title="Refresh conversations"
              >
                <RefreshCw className={`w-4 h-4 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              <Badge className="bg-green-500 text-white text-xs px-2 py-1">
                Live
              </Badge>
            </div>
          </div>

          {/* Bot Selector */}
          {userBots.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Select Bot
              </label>
              <select
                value={selectedBotId || ''}
                onChange={(e) => setSelectedBotId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6566F1] focus:border-transparent"
              >
                {userBots.map((bot) => (
                  <option key={bot.id} value={bot.id}>
                    {bot.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Live Chats Section */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Live Chats</h3>
              <p className="text-xs text-gray-500">Active sessions ({activeConversations.length})</p>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-3">
                <div className="w-8 h-8 border-4 border-[#6566F1] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-gray-500">Loading conversations...</p>
              </div>
            ) : activeConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <MessageCircle className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-sm font-medium text-gray-900">No active chats</p>
                <p className="text-xs text-gray-500 mt-1">Conversations will appear here when<br />visitors start chatting</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedConversationId(conversation.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedConversationId === conversation.id
                      ? 'border-[#6566F1] bg-[#6566F1]/5'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-semibold text-gray-900">{conversation.guestName}</h4>
                        <Badge
                          className={`text-xs px-2 py-0.5 ${
                            conversation.mode === 'AI'
                              ? 'bg-blue-100 text-blue-700 border-blue-200'
                              : 'bg-green-100 text-green-700 border-green-200'
                          }`}
                        >
                          {conversation.mode}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{conversation.guestId}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 truncate">{conversation.lastMessage}</p>
                </div>
              ))}
              </div>
            )}
          </div>

          {/* Completed Section */}
          <div className="p-4 border-t border-gray-200">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Completed</h3>
              <p className="text-xs text-gray-500">Recently closed</p>
            </div>

            <div className="space-y-2">
              {completedConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className="p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 cursor-pointer transition-all"
                >
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-semibold text-gray-900">{conversation.name}</h4>
                        {conversation.resolved && (
                          <CheckCircle2 className="w-3 h-3 text-green-600" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{conversation.guestId}</p>
                    </div>
                    <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
                      {conversation.timestamp}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">{conversation.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{selectedConversation.guestName}</h2>
                <p className="text-xs text-gray-500">{selectedConversation.guestId}</p>
              </div>
              <div>
                {selectedConversation.mode === 'AI' ? (
                  <Button
                    onClick={handleTakeOver}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
                  >
                    Take Over
                  </Button>
                ) : (
                  <Button
                    onClick={handleReturnToAI}
                    className="bg-[#6566F1] hover:bg-[#5A5BD8] text-white px-4 py-2 rounded-lg"
                  >
                    Return to AI
                  </Button>
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {selectedConversation.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'visitor' ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-md px-4 py-3 rounded-2xl ${
                      message.sender === 'visitor'
                        ? 'bg-gray-100 text-gray-900'
                        : message.sender === 'bot'
                        ? 'bg-blue-50 text-gray-900 border border-blue-200'
                        : 'bg-[#2D3748] text-white'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.sender === 'visitor'
                          ? 'text-gray-500'
                          : message.sender === 'bot'
                          ? 'text-blue-600'
                          : 'text-gray-300'
                      }`}
                    >
                      {message.timestamp}
                    </p>
                  </div>
                </div>
              ))}

              {/* Connection Status Message */}
              {selectedConversation.status === 'waiting' && (
                <div className="flex justify-center">
                  <div className="bg-gray-800 text-white px-4 py-2 rounded-full text-sm">
                    Connected to visitor. Waiting for message...
                  </div>
                </div>
              )}
            </div>

            {/* Message Input - Only show when in Human mode */}
            {selectedConversation.mode === 'Human' && (
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Reply as Human agent..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6566F1] focus:border-transparent"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                    className="bg-[#2D3748] hover:bg-[#1A202C] text-white px-6 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">Select a conversation to begin</p>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar - Conversation Info */}
      <div className="w-80 bg-white border-l border-gray-200 p-6">
        {selectedConversation ? (
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-6">Conversation Info</h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-sm text-gray-600">Mode</span>
                <Badge
                  className={`text-xs px-3 py-1 ${
                    selectedConversation.mode === 'AI'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {selectedConversation.mode}
                </Badge>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-sm text-gray-600">Visitor</span>
                <span className="text-sm font-medium text-gray-900">{selectedConversation.guestName}</span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-sm text-gray-600">Status</span>
                <Badge className="bg-gray-100 text-gray-700 text-xs px-3 py-1">
                  {selectedConversation.status}
                </Badge>
              </div>
            </div>

            {/* Tips Section */}
            <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <p className="text-sm text-blue-900">
                <span className="font-semibold">Tip:</span> Click{' '}
                <span className="font-semibold">Take Over</span> to switch visitor widget to Human instantly.
              </p>
            </div>

            {/* Dynamic Toggle Info */}
            {selectedConversation.mode === 'Human' && (
              <div className="mt-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
                <p className="text-sm text-purple-900">
                  Toggle button is dynamic. It becomes{' '}
                  <span className="font-semibold">Return to AI</span> when you are in Human mode.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-gray-400 mt-12">
            <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">Select a chat to view details</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HumanHandoff;
