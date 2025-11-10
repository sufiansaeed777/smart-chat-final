'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Bot, Send, MessageSquare, User, ArrowLeft, Search, Filter } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Add custom styles for animations
const styles = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out;
  }
  
  /* Custom scroll behavior for 2-second duration */
  html {
    scroll-behavior: smooth;
  }
  
  /* Override default smooth scroll timing */
  * {
    scroll-behavior: smooth;
  }
`;

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface BotInfo {
  id: string;
  name: string;
  description: string;
  domain: string;
  status: string;
}

interface ManagerBot {
  id: string;
  name: string;
  description: string;
  domain: string;
  status: string;
  conversations: number;
  totalUsers: number;
  lastActive: string;
  assignedUsers: string[];
  createdAt: string;
  lastConversation: string | null;
}

export default function TestBotPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const botId = searchParams.get('botId');
  const [bot, setBot] = useState<BotInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingBot, setIsLoadingBot] = useState(!!botId);
  const [isLoadingConversations, setIsLoadingConversations] = useState(!!botId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Sidebar state
  const [allBots, setAllBots] = useState<ManagerBot[]>([]);
  const [loadingBots, setLoadingBots] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Bot selection state
  const [selectedBotId, setSelectedBotId] = useState<string | null>(null);
  
  // Scroll state
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Status filter options
  const statusOptions = [
    { value: 'all', label: 'All Status', icon: '📊' },
    { value: 'active', label: 'Active', icon: '🟢' },
    { value: 'paused', label: 'Paused', icon: '🟡' },
    { value: 'inactive', label: 'Inactive', icon: '⚫' }
  ];

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle scroll to show/hide scroll button
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
      console.log('Scroll detected:', { scrollTop, scrollHeight, clientHeight, isNearBottom, messageCount: messages.length });
      setShowScrollButton(!isNearBottom && messages.length > 2);
    }
  };

  // Scroll to bottom function for the button
  const scrollToBottomButton = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // Smooth scroll to bottom of entire page when page loads (2 seconds duration)
  const scrollToBottomOnLoad = () => {
    setTimeout(() => {
      const startPosition = window.pageYOffset;
      const targetPosition = document.documentElement.scrollHeight - window.innerHeight;
      const distance = targetPosition - startPosition;
      const duration = 1000; // 1 second
      let startTime: number | null = null;

      const animateScroll = (currentTime: number) => {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const progress = Math.min(timeElapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeInOutCubic = progress < 0.5 
          ? 4 * progress * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        
        window.scrollTo(0, startPosition + distance * easeInOutCubic);
        
        if (progress < 1) {
          requestAnimationFrame(animateScroll);
        }
      };

      requestAnimationFrame(animateScroll);
    }, 100); // Small delay to ensure DOM is ready
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Scroll to bottom when page first loads
  useEffect(() => {
    if (!isLoadingBot && bot) {
      scrollToBottomOnLoad();
    }
  }, [isLoadingBot, bot]);

  // Load all bots for sidebar
  const loadAllBots = async () => {
    try {
        const response = await fetch('/api/user/assigned-bots');
        if (response.ok) {
          const data = await response.json();
        setAllBots(data.bots || []);
        } else {
        console.error('Failed to fetch bots');
        }
      } catch (error) {
      console.error('Error fetching bots:', error);
      } finally {
      setLoadingBots(false);
    }
  };

  // Load previous conversations
  const loadConversations = async () => {
    if (!selectedBotId) return;
    
    console.log('Loading conversations for bot:', selectedBotId);
    try {
      const response = await fetch(`/api/conversations/bot/${selectedBotId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Conversations response:', data);
        if (data.success && data.conversations) {
          const formattedMessages = data.conversations.map((conv: { id: string; message: string; sender: 'user' | 'bot'; timestamp: string }) => ({
            id: conv.id,
            content: conv.message,
            sender: conv.sender,
            timestamp: new Date(conv.timestamp)
          }));
          console.log('Formatted messages:', formattedMessages);
          setMessages(formattedMessages);
        } else {
          console.log('No conversations found for this bot');
          setMessages([]);
        }
      } else {
        console.error('Failed to fetch conversations:', response.status);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  // Initialize selectedBotId from URL on mount
  useEffect(() => {
    if (botId && !selectedBotId) {
      setSelectedBotId(botId);
    }
  }, [botId, selectedBotId]);

  // Fetch bot information and conversations
  useEffect(() => {
    const fetchBot = async () => {
      if (!selectedBotId) {
        console.log('No selectedBotId provided, clearing bot and conversations');
        setBot(null);
        setMessages([]);
        setIsLoadingBot(false);
        setIsLoadingConversations(false);
        return;
      }
      
      console.log('Fetching bot information for:', selectedBotId);
      try {
        const response = await fetch(`/api/user/bot/${selectedBotId}`);
        if (response.ok) {
          const botData = await response.json();
          console.log('Bot data received:', botData);
          setBot(botData);
        } else {
          console.error('Failed to fetch bot:', response.status);
        }
      } catch (error) {
        console.error('Error fetching bot:', error);
      } finally {
        setIsLoadingBot(false);
      }
    };

    fetchBot();
    if (selectedBotId) {
    loadConversations();
    } else {
      setIsLoadingConversations(false);
    }
  }, [selectedBotId, allBots]);

  // Load all bots on component mount
  useEffect(() => {
    loadAllBots();
  }, []);

  // Send message to bot via n8n
  const sendMessage = async () => {
    if (!inputMessage.trim() || !bot) return;

    const messageToSend = inputMessage; // Store the message before clearing input

    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageToSend,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          botId: bot.id,
          message: messageToSend,
          userId: 'test-user', // For testing purposes
          isTestMessage: true // Flag to identify test messages
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.response || 'Sorry, I could not process your message.',
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: 'Sorry, there was an error processing your message. Please try again.',
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, there was an error connecting to the bot. Please try again.',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Allow Shift + Enter for new line (default behavior)
        return;
      } else {
        // Enter without Shift sends the message
        e.preventDefault();
        sendMessage();
      }
    }
  };

  // Filter bots based on search and status
  const filteredBots = allBots.filter(botItem => {
    const matchesSearch = botItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         botItem.domain.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || botItem.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Handle bot selection
  const handleBotSelect = (botIdToSelect: string) => {
    // Clear current messages when selecting a new bot
    setMessages([]);
    setIsLoadingBot(true);
    setIsLoadingConversations(true);
    
    // Update URL without page reload
    const newUrl = `/user-dashboard/playground?botId=${botIdToSelect}`;
    window.history.pushState({}, '', newUrl);
    
    // Set the new bot ID to trigger the useEffect
    setSelectedBotId(botIdToSelect);
  };

  // Handle status filter selection
  const handleStatusSelect = (value: string) => {
    setStatusFilter(value);
    setIsDropdownOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Handle scroll events for scroll button
  useEffect(() => {
    const messagesContainer = messagesContainerRef.current;
    if (messagesContainer) {
      messagesContainer.addEventListener('scroll', handleScroll);
      return () => {
        messagesContainer.removeEventListener('scroll', handleScroll);
      };
    }
  }, [messages.length]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  if (isLoadingBot || isLoadingConversations) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading bot and conversations...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show bot selection message when no bot is selected, but still show the input area
  const showBotSelection = !selectedBotId;

  // Memoize the bot list to prevent unnecessary re-renders
  const BotListSection = React.memo(function BotListSection() {
  return (
    <div className="w-96 h-screen bg-white/95 backdrop-blur-xl border-r border-gray-200/80 flex flex-col shadow-2xl shadow-gray-200/30 overflow-hidden">
      {/* Enhanced Sidebar Header */}
      <div className="p-6 border-b border-gray-200/80 bg-gradient-to-r from-white via-indigo-50/40 to-purple-50/40">
        <div className="flex items-center space-x-2 mb-6">
            <Button 
          variant="ghost"
          size="sm"
              onClick={() => router.push('/user-dashboard/bots')}
          className="text-gray-600 hover:text-gray-900 hover:bg-white/80 transition-all duration-200 rounded-lg px-2 py-1.5 text-xs font-medium border border-gray-200/60 hover:border-indigo-300/60 hover:shadow-md"
            >
          <ArrowLeft className="w-3 h-3 mr-1" />
            Back to Bots
            </Button>
                  </div>
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-200/50 ring-2 ring-indigo-100/50">
            <Bot className="w-6 h-6 text-white" />
                  </div>
          <div>
            <h2 className="text-base font-bold bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent">Test Your Bots</h2>
            <p className="text-xs text-gray-600 font-medium">Interactive testing environment</p>
                </div>
                </div>

        {/* Enhanced Search and Filter */}
        <div className="space-y-3 mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search bots..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-200/60 rounded-lg focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-gray-900 bg-white/90 backdrop-blur-sm transition-all duration-200 shadow-sm hover:shadow-md text-xs font-medium placeholder-gray-500"
            />
          </div>
          <div className="relative" ref={dropdownRef}>
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full pl-10 pr-10 py-2 border-2 border-gray-200/60 rounded-lg focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-gray-900 bg-white/90 backdrop-blur-sm transition-all duration-200 shadow-sm hover:shadow-md text-xs font-medium cursor-pointer text-left"
            >
              {statusOptions.find(option => option.value === statusFilter)?.label || 'All Status'}
            </button>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg 
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
        </div>

            {/* Custom Dropdown Options */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white/95 backdrop-blur-xl border-2 border-indigo-200/80 rounded-lg shadow-xl shadow-indigo-200/40 z-50 overflow-hidden ring-2 ring-indigo-100/50">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleStatusSelect(option.value)}
                    className={`w-full px-4 py-3 text-left text-xs font-medium transition-all duration-200 flex items-center space-x-3 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 ${
                      statusFilter === option.value 
                        ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border-l-4 border-indigo-500' 
                        : 'text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    <span className="text-base">{option.icon}</span>
                    <span className="flex-1">{option.label}</span>
                    {statusFilter === option.value && (
                      <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        </div>

      {/* Enhanced Bot List */}
      <div className="flex-1 overflow-y-auto p-3 bg-gradient-to-b from-white/50 to-blue-50/20">
        {loadingBots ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
              <p className="text-gray-600 text-xs">Loading bots...</p>
              </div>
          </div>
        ) : filteredBots.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Bot className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-500 text-xs font-medium">No bots found</p>
            <p className="text-gray-400 text-xs mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBots.map((botItem) => (
              <div
                key={botItem.id}
                onClick={() => handleBotSelect(botItem.id)}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
                  botItem.id === selectedBotId
                    ? 'bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-indigo-400 shadow-xl shadow-indigo-200/60 ring-2 ring-indigo-100/50'
                    : 'bg-white/90 backdrop-blur-sm border-gray-200/80 hover:border-indigo-400/60 hover:shadow-lg hover:shadow-indigo-200/40 hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${
                    botItem.id === selectedBotId
                      ? 'bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 shadow-indigo-200/60 ring-2 ring-indigo-100/50'
                      : 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-200/50'
                  }`}>
                    <Bot className="w-6 h-6 text-white" />
              </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-gray-900 truncate text-sm">{botItem.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold shadow-sm flex-shrink-0 ml-2 ${
                        botItem.status === 'active' 
                          ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200' 
                          : botItem.status === 'paused' 
                          ? 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-200'
                          : 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border border-gray-200'
                      }`}>
                        {botItem.status === 'active' ? '🟢' : botItem.status === 'paused' ? '🟡' : '⚫'} {botItem.status.charAt(0).toUpperCase() + botItem.status.slice(1)}
                      </span>
                </div>
                    <p className="text-xs text-gray-600 truncate font-medium">{botItem.description || botItem.domain}</p>
              </div>
                </div>
              </div>
            ))}
            </div>
        )}
          </div>
        </div>
  );
  });

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex overflow-hidden">
        {/* Enhanced Sidebar */}
        <BotListSection />

        {/* Enhanced Main Content */}
        <div className="flex-1 flex flex-col bg-gradient-to-br from-slate-50/50 to-blue-50/30 h-screen overflow-hidden">

        {/* Enhanced Chat Container */}
        <div className="flex-1 flex flex-col h-screen">
          <div className="bg-white/95 backdrop-blur-xl border border-gray-200/80 shadow-2xl shadow-gray-200/40 overflow-hidden flex flex-col h-full rounded-2xl m-2">

            {/* Enhanced Messages */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-white via-blue-50/20 to-indigo-50/30 relative min-h-0"
            >
              {showBotSelection ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <div className="relative mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 rounded-3xl flex items-center justify-center shadow-xl shadow-indigo-200/50 ring-4 ring-indigo-100/50">
                      <Bot className="w-10 h-10 text-indigo-600" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent mb-3">Select a Bot to Test</h3>
                  <p className="text-gray-600 max-w-lg leading-relaxed text-base mb-6 font-medium">
                    Choose a bot from the sidebar to start testing conversations and interactions.
              </p>
              <Button
                onClick={() => router.push('/user-dashboard/bots')}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm px-6 py-3 rounded-xl shadow-lg shadow-indigo-200/50 font-medium"
              >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to My Bots
              </Button>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <div className="relative mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200/50 ring-2 ring-indigo-100/50">
                      <Bot className="w-8 h-8 text-indigo-600" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-md ring-2 ring-white">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent mb-2">Ready to Chat!</h3>
                  <p className="text-gray-600 max-w-lg leading-relaxed text-sm mb-6 font-medium">
                    Start a conversation with your bot.
                  </p>
                  <div className="flex flex-wrap gap-3 justify-center">
                    <span className="px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 rounded-xl text-sm font-semibold shadow-md border border-indigo-200/60">Try asking about {bot?.domain}</span>
                    <span className="px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-xl text-sm font-semibold shadow-md border border-purple-200/60">Test different scenarios</span>
                  </div>
                </div>
        ) : (
          <>
                  {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                  >
                      <div className={`flex items-start space-x-3 max-w-3xl ${
                      message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                    }`}>
                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md flex-shrink-0 ${
                        message.sender === 'user' 
                            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 ring-2 ring-indigo-200/50' 
                            : 'bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-gray-300 ring-2 ring-gray-200/50'
                      }`}>
                        {message.sender === 'user' ? (
                            <User className="w-4 h-4 text-white" />
                        ) : (
                            <Bot className="w-4 h-4 text-gray-600" />
                        )}
                      </div>
                        
                        {/* Message Bubble */}
                        <div className={`px-4 py-3 rounded-2xl shadow-lg max-w-2xl ${
                        message.sender === 'user' 
                            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-br-md' 
                            : 'bg-white border-2 border-gray-200 text-gray-900 rounded-bl-md'
                        }`}>
                          <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
                            {message.content}
                        </div>
                          <div className={`text-xs mt-2 font-medium ${
                            message.sender === 'user' ? 'text-indigo-100' : 'text-gray-500'
                        }`}>
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    </div>
                  ))}
                </>
              )}
              {isLoading && (
                <div className="flex justify-start animate-fadeIn">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-gray-300 flex items-center justify-center shadow-md ring-2 ring-gray-200/50">
                      <Bot className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="bg-white border-2 border-gray-200 px-4 py-3 rounded-2xl shadow-lg rounded-bl-md">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
              
              {/* Scroll to Bottom Button */}
              {showScrollButton && (
                <button
                  onClick={scrollToBottomButton}
                  className="absolute bottom-4 right-4 w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-full shadow-lg shadow-indigo-200/50 hover:shadow-xl hover:shadow-indigo-200/70 transition-all duration-200 flex items-center justify-center z-10"
                  title="Scroll to bottom"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </button>
              )}
            </div>

            {/* Enhanced Input - Fixed at Bottom */}
                <div className="bg-white/95 backdrop-blur-xl border-t border-gray-200/80 p-4 flex-shrink-0">
              <div className="flex space-x-3">
                <div className="flex-1 relative">
                  <textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={showBotSelection ? "Select a bot to start chatting..." : "Type your message here..."}
                        className="w-full pl-4 pr-12 py-3 border-2 border-gray-200/60 rounded-xl focus:border-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus-visible:outline-none transition-all duration-200 bg-white/90 backdrop-blur-sm text-gray-900 placeholder-gray-500 resize-none min-h-[48px] max-h-24 shadow-lg shadow-gray-200/30 text-sm font-medium"
                    disabled={isLoading || showBotSelection}
                    rows={1}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                          <MessageSquare className="w-4 h-4 text-white" />
                      </div>
                      </div>
                    </div>
                <Button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isLoading || showBotSelection}
                      className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl shadow-lg shadow-indigo-200/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
