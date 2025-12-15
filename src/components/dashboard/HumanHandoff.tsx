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
  RefreshCw,
  Mail,
  Globe,
  MapPin,
  Calendar,
  Hash
} from 'lucide-react';

interface Message {
  id: string;
  sender: 'visitor' | 'agent' | 'bot' | 'system';
  text: string;
  timestamp: string;
  type?: 'notification' | 'message';
}

interface Conversation {
  id: string;
  guestName: string;
  guestId: string;
  visitorEmail?: string;
  pageUrl?: string;
  country?: string;
  mode: 'AI' | 'Human';
  status: 'active' | 'waiting' | 'idle' | 'completed';
  lastMessage: string;
  firstMessage?: string;
  timestamp: string;
  messages: Message[];
  messageCount?: number;
  firstMessageTime?: string;
  lastMessageAt?: string;
  createdAt?: string;
  isHandoffRequest?: boolean;
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

  // Fetch user's bots - try user endpoint first (for regular users), then manager endpoint
  const fetchUserBots = async () => {
    try {
      // First try the user bots endpoint (for regular users with assigned bots)
      let response = await fetch('/api/user/bots');
      let data = await response.json();

      // If user bots returns empty or unauthorized, try manager bots
      if (!response.ok || (data.bots && data.bots.length === 0)) {
        response = await fetch('/api/manager/bots');
        if (response.ok) {
          data = await response.json();
        }
      }

      const bots = data.bots || [];
      setUserBots(bots);
      // Auto-select first bot if available
      if (bots.length > 0 && !selectedBotId) {
        setSelectedBotId(bots[0].id);
      }
    } catch (error) {
      console.error('Error fetching user bots:', error);
    }
  };

  // Fetch all conversations from API (including completed/idle for re-activation detection)
  const fetchConversations = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) setIsRefreshing(true);

      // Fetch active conversations
      const activeUrl = selectedBotId
        ? `/api/conversations?botId=${selectedBotId}`
        : '/api/conversations';

      // Fetch completed/idle conversations
      const completedUrl = selectedBotId
        ? `/api/conversations?status=completed,idle&botId=${selectedBotId}`
        : '/api/conversations?status=completed,idle';

      const [activeResponse, completedResponse] = await Promise.all([
        fetch(activeUrl),
        fetch(completedUrl)
      ]);

      const [activeData, completedData] = await Promise.all([
        activeResponse.json(),
        completedResponse.json()
      ]);

      if (activeData.success) {
        // Merge active and completed conversations, removing duplicates
        const activeConvs = activeData.conversations || [];
        const completedConvs = completedData.success ? (completedData.conversations || []) : [];

        // Create a map to avoid duplicates (prefer active version)
        const conversationMap = new Map();

        // Add completed conversations first
        completedConvs.forEach((conv: Conversation) => {
          conversationMap.set(conv.id, conv);
        });

        // Then add/override with active conversations
        activeConvs.forEach((conv: Conversation) => {
          conversationMap.set(conv.id, conv);
        });

        const allConversations = Array.from(conversationMap.values());
        setConversations(allConversations);

        // Update completed conversations list - filter out those with recent activity
        const now = Date.now();
        const thirtyMinutesMs = 30 * 60 * 1000;

        const completedList = allConversations
          .filter((conv: Conversation) => {
            if (!conv.messages || conv.messages.length === 0) return false;
            // Only show in completed if last message is older than 30 minutes
            const lastMessageTime = conv.lastMessageAt ? new Date(conv.lastMessageAt).getTime() : 0;
            const timeSinceLastMessage = now - lastMessageTime;
            return timeSinceLastMessage >= thirtyMinutesMs;
          })
          .map((conv: Conversation) => ({
            id: conv.id,
            name: conv.guestName,
            guestId: conv.guestId,
            note: conv.lastMessage,
            timestamp: conv.timestamp,
            lastMessageAt: conv.lastMessageAt,
            status: conv.status,
            resolved: conv.status === 'completed'
          }));

        setCompletedConversations(completedList);

        // Auto-select first conversation with messages if none selected (only on initial load)
        setSelectedConversationId(prevId => {
          if (!prevId && allConversations.length > 0) {
            // Find first conversation with recent messages (active)
            const firstActiveConv = allConversations.find((conv: Conversation) => {
              if (!conv.messages || conv.messages.length === 0) return false;
              const lastMessageTime = conv.lastMessageAt ? new Date(conv.lastMessageAt).getTime() : 0;
              return (now - lastMessageTime) < thirtyMinutesMs;
            });
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

  // Legacy function - now handled by fetchConversations
  const fetchCompletedConversations = async () => {
    // This is now handled within fetchConversations to ensure proper synchronization
    // Keeping this function for compatibility but it's essentially a no-op
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

  // Auto-revert check every minute (revert conversations to AI if agent hasn't responded in 10 mins)
  useEffect(() => {
    if (!selectedBotId) return;

    const checkAutoRevert = async () => {
      try {
        const response = await fetch('/api/conversations/auto-revert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ botId: selectedBotId })
        });

        const data = await response.json();

        if (data.success && data.revertedCount > 0) {
          console.log(`[AUTO-REVERT] ${data.revertedCount} conversation(s) reverted to AI mode`);
          // Refresh conversations to reflect the changes
          fetchConversations(false);
        }
      } catch (error) {
        console.error('Auto-revert check failed:', error);
      }
    };

    // Run immediately on mount and then every minute
    checkAutoRevert();
    const interval = setInterval(checkAutoRevert, 60000); // Every 60 seconds

    return () => clearInterval(interval);
  }, [selectedBotId]);

  const selectedConversation = conversations.find(conv => conv.id === selectedConversationId);

  // Helper function to check if conversation is within time window
  const isWithinMinutes = (lastMessageAt: string | undefined, minutes: number) => {
    if (!lastMessageAt) return true; // Assume active if no timestamp
    const lastTime = new Date(lastMessageAt).getTime();
    const now = Date.now();
    return (now - lastTime) < (minutes * 60 * 1000);
  };

  // Filter active conversations: must have messages AND be within last 30 minutes
  const activeConversations = conversations.filter(conv => {
    if (!conv.messages || conv.messages.length === 0) return false;
    // Active if message received within last 30 minutes
    return isWithinMinutes(conv.lastMessageAt, 30);
  });

  // Filter completed conversations: inactive for 30+ min but within last 24 hours
  const recentCompletedConversations = completedConversations.filter(conv => {
    const lastTime = conv.lastMessageAt ? new Date(conv.lastMessageAt).getTime() :
                     conv.timestamp ? new Date(conv.timestamp).getTime() : 0;
    const now = Date.now();
    const thirtyMinutesMs = 30 * 60 * 1000;
    const twentyFourHoursMs = 24 * 60 * 60 * 1000;
    const timeSinceLastMessage = now - lastTime;

    // Show in completed only if:
    // 1. Last message was more than 30 minutes ago (not active)
    // 2. Last message was within last 24 hours (recent enough to show)
    return timeSinceLastMessage >= thirtyMinutesMs && timeSinceLastMessage < twentyFourHoursMs;
  });

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

  const handleCompleteChat = async () => {
    if (selectedConversation) {
      try {
        // Pause auto-refresh during manual action
        setPauseAutoRefresh(true);

        const response = await fetch(`/api/conversations/${selectedConversation.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'completed',
            message: "This conversation has been marked as complete. Thank you for chatting with us!"
          })
        });

        const data = await response.json();

        if (data.success) {
          // Remove from active conversations
          setConversations(prevConversations =>
            prevConversations.filter(conv => conv.id !== selectedConversation.id)
          );

          // Add to completed conversations
          setCompletedConversations(prev => [{
            id: selectedConversation.id,
            name: selectedConversation.guestName,
            guestId: selectedConversation.guestId,
            note: selectedConversation.lastMessage,
            timestamp: 'Just now',
            status: 'completed',
            resolved: true
          }, ...prev]);

          // Clear selection
          setSelectedConversationId(null);

          // Resume auto-refresh
          setTimeout(() => {
            setPauseAutoRefresh(false);
          }, 1000);
        } else {
          setPauseAutoRefresh(false);
        }
      } catch (error) {
        console.error('Error completing conversation:', error);
        setPauseAutoRefresh(false);
      }
    }
  };

  // Helper to format date/time in GMT 0 (UTC)
  const formatDateTime = (dateString: string | undefined) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Unknown';
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC'
    }) + ' GMT';
  };

  // Helper to format message timestamp in GMT 0
  // Shows date for older messages, time only for today's messages
  const formatMessageTime = (timestamp: string | undefined) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return timestamp; // Return original if can't parse

    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const messageDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

    // Check if message is from today
    const isToday = today.getTime() === messageDay.getTime();

    // Check if message is from yesterday
    const yesterday = new Date(today);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const isYesterday = yesterday.getTime() === messageDay.getTime();

    // Check if message is from this year
    const isThisYear = date.getUTCFullYear() === now.getUTCFullYear();

    const timeStr = date.toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC'
    });

    if (isToday) {
      return timeStr + ' GMT';
    } else if (isYesterday) {
      return `Yesterday, ${timeStr} GMT`;
    } else if (isThisYear) {
      const dateStr = date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC'
      });
      return `${dateStr}, ${timeStr} GMT`;
    } else {
      const dateStr = date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC'
      });
      return `${dateStr}, ${timeStr} GMT`;
    }
  };

  // Count handoff requests (conversations where mode is Human and status is waiting)
  const handoffRequestCount = conversations.filter(
    conv => conv.mode === 'Human' && conv.status === 'waiting'
  ).length;

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-50">
      {/* Left Sidebar - Conversations List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">Agent Console</h2>
            <div className="flex items-center space-x-2">
              {/* Handoff Request Indicator */}
              {handoffRequestCount > 0 && (
                <Badge className="bg-red-500 text-white text-xs px-2 py-1 font-semibold animate-pulse">
                  {handoffRequestCount} Handoff{handoffRequestCount > 1 ? 's' : ''}
                </Badge>
              )}
              <button
                onClick={() => fetchConversations(true)}
                disabled={isRefreshing}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                title="Refresh conversations"
              >
                <RefreshCw className={`w-4 h-4 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              <Badge className="bg-green-100 text-green-700 text-xs px-2 py-1 font-semibold">
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
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6566F1] focus:border-[#6566F1] bg-white text-gray-800"
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
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Active Chats</h3>
                <p className="text-xs text-gray-500">Last 30 minutes</p>
              </div>
              <Badge className="bg-green-100 text-green-700 text-xs px-2 py-1">
                {activeConversations.length} active
              </Badge>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-3">
                <div className="w-8 h-8 border-4 border-[#6566F1] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-gray-500">Loading conversations...</p>
              </div>
            ) : activeConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center bg-gray-50 rounded-xl border border-gray-200">
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
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedConversationId === conversation.id
                      ? 'border-[#6566F1] bg-[#6566F1]/5 shadow-sm'
                      : conversation.isHandoffRequest || (conversation.mode === 'Human' && conversation.status === 'waiting')
                        ? 'border-red-300 bg-red-50 hover:border-red-400'
                        : 'border-gray-200 hover:border-[#6566F1]/50 hover:bg-gray-50 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-semibold text-gray-900">{conversation.guestName}</h4>
                        <Badge
                          className={`text-xs px-2 py-0.5 ${
                            conversation.isHandoffRequest || (conversation.mode === 'Human' && conversation.status === 'waiting')
                              ? 'bg-red-500 text-white animate-pulse'
                              : conversation.mode === 'AI'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {conversation.isHandoffRequest || (conversation.mode === 'Human' && conversation.status === 'waiting')
                            ? 'Needs Help'
                            : conversation.mode}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{conversation.guestId}</p>
                    </div>
                    <div className={`w-2 h-2 rounded-full animate-pulse ${
                      conversation.isHandoffRequest || (conversation.mode === 'Human' && conversation.status === 'waiting')
                        ? 'bg-red-500'
                        : 'bg-green-500'
                    }`}></div>
                  </div>
                  <p className="text-xs text-gray-600 truncate">{conversation.lastMessage}</p>
                  <p className="text-xs text-[#6566F1] mt-1">{conversation.timestamp}</p>
                </div>
              ))}
              </div>
            )}
          </div>

          {/* Completed Section */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Completed</h3>
                <p className="text-xs text-gray-500">Last 24 hours</p>
              </div>
              <Badge className="bg-purple-100 text-purple-700 text-xs px-2 py-1">
                {recentCompletedConversations.length} closed
              </Badge>
            </div>

            {recentCompletedConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center bg-white rounded-xl border border-gray-200">
                <CheckCircle2 className="w-10 h-10 text-gray-300 mb-2" />
                <p className="text-xs text-gray-500">No completed chats in last 24 hours</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentCompletedConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => {
                      // Find full conversation data and select it to view transcript
                      const fullConv = conversations.find(c => c.id === conversation.id);
                      if (fullConv) {
                        setSelectedConversationId(conversation.id);
                      } else {
                        // If not in active list, fetch and show
                        setSelectedConversationId(conversation.id);
                      }
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedConversationId === conversation.id
                        ? 'border-[#6566F1] bg-[#6566F1]/5 shadow-sm'
                        : 'border-gray-200 hover:border-[#6566F1]/50 hover:bg-white bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-semibold text-gray-900">{conversation.name}</h4>
                          {conversation.resolved ? (
                            <CheckCircle2 className="w-3 h-3 text-green-600" />
                          ) : (
                            <Clock className="w-3 h-3 text-yellow-500" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{conversation.guestId}</p>
                      </div>
                      <Badge className={`text-xs px-2 py-0.5 ${
                        conversation.resolved
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {conversation.resolved ? 'Completed' : 'Idle'}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 truncate">{conversation.note}</p>
                    <p className="text-xs text-gray-400 mt-1">{conversation.timestamp}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-[#6566F1] flex items-center justify-center text-white font-semibold">
                  {(selectedConversation.guestName || 'Unknown').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selectedConversation.guestName || 'Unknown'}</h2>
                  <p className="text-xs text-gray-500">{selectedConversation.guestId}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={handleCompleteChat}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-xl"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Complete
                </Button>
                {selectedConversation.mode === 'AI' ? (
                  <Button
                    onClick={handleTakeOver}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl"
                  >
                    Take Over
                  </Button>
                ) : (
                  <Button
                    onClick={handleReturnToAI}
                    className="bg-[#6566F1] hover:bg-[#5A5BD8] text-white px-4 py-2 rounded-xl"
                  >
                    Return to AI
                  </Button>
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
              {selectedConversation.messages.map((message) => {
                // Handle notification messages (system notifications)
                if (message.type === 'notification' || message.sender === 'system') {
                  return (
                    <div key={message.id} className="flex justify-center">
                      <div className="bg-gradient-to-r from-blue-50 to-sky-50 text-sky-700 px-4 py-1.5 rounded-full text-xs font-medium border border-sky-200">
                        {message.text}
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'visitor' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-md px-4 py-3 rounded-2xl ${
                        message.sender === 'visitor'
                          ? 'bg-white border border-gray-200 text-gray-900'
                          : message.sender === 'bot'
                          ? 'bg-blue-50 text-gray-900 border border-blue-200'
                          : 'bg-[#6566F1] text-white'
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <p
                        className={`text-xs mt-1 ${
                          message.sender === 'visitor'
                            ? 'text-gray-400'
                            : message.sender === 'bot'
                            ? 'text-blue-600'
                            : 'text-white/70'
                        }`}
                      >
                        {formatMessageTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })}

              {/* Connection Status Message */}
              {selectedConversation.status === 'waiting' && (
                <div className="flex justify-center">
                  <div className="bg-yellow-500 text-white px-4 py-2 rounded-full text-sm">
                    Connected to visitor. Waiting for message...
                  </div>
                </div>
              )}
            </div>

            {/* Message Input - Only show when in Human mode */}
            {selectedConversation.mode === 'Human' && (
              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Reply as Human agent..."
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6566F1] focus:border-[#6566F1] bg-white"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                    className="bg-[#6566F1] hover:bg-[#5A5BD8] text-white px-6 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-lg font-medium text-gray-700">Select a conversation</p>
              <p className="text-sm text-gray-400 mt-1">Choose a chat from the sidebar to begin</p>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar - Conversation Info */}
      <div className="w-80 bg-white border-l border-gray-200 p-6">
        {selectedConversation ? (
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Visitor Info</h3>

            {/* Visitor Profile Card */}
            <div className="bg-[#6566F1] rounded-2xl p-4 mb-6 text-white">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">
                  {(selectedConversation.guestName || 'Unknown').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-semibold">{selectedConversation.guestName || 'Unknown'}</h4>
                  <p className="text-xs text-white/70">{selectedConversation.guestId}</p>
                </div>
              </div>
              <Badge
                className={`text-xs px-3 py-1 ${
                  selectedConversation.mode === 'AI'
                    ? 'bg-blue-400/30 text-white border border-blue-300/30'
                    : 'bg-green-400/30 text-white border border-green-300/30'
                }`}
              >
                {selectedConversation.mode} Mode
              </Badge>
            </div>

            {/* Info Grid */}
            <div className="space-y-3">
              {/* Email */}
              <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                <Mail className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-500">Email</p>
                  <p className="text-sm text-gray-900 truncate">{selectedConversation.visitorEmail || 'Unknown'}</p>
                </div>
              </div>

              {/* Page URL */}
              <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-xl border border-green-100">
                <Globe className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-500">Page URL</p>
                  <p className="text-sm text-gray-900 truncate" title={selectedConversation.pageUrl || 'Unknown'}>
                    {selectedConversation.pageUrl || 'Unknown'}
                  </p>
                </div>
              </div>

              {/* Country */}
              <div className="flex items-start space-x-3 p-3 bg-orange-50 rounded-xl border border-orange-100">
                <MapPin className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-500">Country</p>
                  <p className="text-sm text-gray-900">{selectedConversation.country || 'Unknown'}</p>
                </div>
              </div>

              {/* First Message Content */}
              <div className="flex items-start space-x-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                <MessageCircle className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-500">First Message</p>
                  <p className="text-sm text-gray-900 line-clamp-2" title={selectedConversation.firstMessage || 'No messages yet'}>
                    {selectedConversation.firstMessage || 'No messages yet'}
                  </p>
                </div>
              </div>

              {/* Started At */}
              <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-xl border border-purple-100">
                <Calendar className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-500">Started At</p>
                  <p className="text-sm text-gray-900">{formatDateTime(selectedConversation.firstMessageTime)}</p>
                </div>
              </div>

              {/* Total Messages */}
              <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <Hash className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-500">Total Messages</p>
                  <p className="text-sm text-gray-900 font-semibold">{selectedConversation.messageCount || selectedConversation.messages?.length || 0}</p>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <Clock className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-500">Status</p>
                  <Badge className={`text-xs px-2 py-0.5 mt-1 ${
                    selectedConversation.status === 'active' ? 'bg-green-100 text-green-700' :
                    selectedConversation.status === 'waiting' ? 'bg-yellow-100 text-yellow-700' :
                    selectedConversation.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {selectedConversation.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Tips Section */}
            <div className="mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
              <p className="text-sm text-yellow-800">
                <span className="font-semibold">Tip:</span> Click{' '}
                <span className="font-semibold">Take Over</span> to switch visitor widget to Human mode instantly.
              </p>
            </div>

            {/* Dynamic Toggle Info */}
            {selectedConversation.mode === 'Human' && (
              <div className="mt-3 p-4 bg-[#6566F1]/10 rounded-xl border border-[#6566F1]/20">
                <p className="text-sm text-[#6566F1]">
                  You are in <span className="font-semibold">Human mode</span>. Click{' '}
                  <span className="font-semibold">Return to AI</span> to hand back to bot.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-gray-400 mt-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600">No chat selected</p>
            <p className="text-xs text-gray-400 mt-1">Select a conversation to view visitor details</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HumanHandoff;
