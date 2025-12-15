'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Bot, Send, MessageSquare, User, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import RoleGuard from '@/components/auth/RoleGuard';

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

function UserTestBotPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const botId = searchParams.get('botId');
  const [bot, setBot] = useState<BotInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingBot, setIsLoadingBot] = useState(true);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

  // Load previous conversations
  const loadConversations = async () => {
    if (!botId) return;
    
    try {
      const response = await fetch(`/api/conversations/bot/${botId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.conversations) {
          const formattedMessages = data.conversations.map((conv: { id: string; message: string; sender: 'user' | 'bot'; timestamp: string }) => ({
            id: conv.id,
            content: conv.message,
            sender: conv.sender,
            timestamp: new Date(conv.timestamp)
          }));
          setMessages(formattedMessages);
        }
      } else {
        console.error('Failed to fetch conversations');
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  // Fetch bot information and conversations
  useEffect(() => {
    const fetchBot = async () => {
      if (!botId) return;
      
      try {
        // First check if user has access to this bot
        const assignedBotsResponse = await fetch('/api/user/assigned-bots');
        if (assignedBotsResponse.ok) {
          const assignedBotsData = await assignedBotsResponse.json();
          const hasAccess = assignedBotsData.bots?.some((assignedBot: { id: string }) => assignedBot.id === botId);
          
          if (!hasAccess) {
            setError('You do not have access to test this bot. Only bots assigned to you by your manager can be tested.');
            setIsLoadingBot(false);
            return;
          }
        }

        // Get bot details from assigned bots
        const assignedBotsResponse2 = await fetch('/api/user/assigned-bots');
        if (assignedBotsResponse2.ok) {
          const assignedBotsData = await assignedBotsResponse2.json();
          const assignedBot = assignedBotsData.bots?.find((bot: { id: string; name: string; description?: string; domain?: string }) => bot.id === botId);
          
          if (assignedBot) {
            setBot({
              id: assignedBot.id,
              name: assignedBot.name,
              description: assignedBot.description || 'No description available',
              domain: assignedBot.domain || 'General',
              status: assignedBot.status || 'active'
            });
          } else {
            setError('Bot not found or you do not have access to it.');
          }
        } else {
          setError('Failed to fetch bot information.');
        }
      } catch (error) {
        console.error('Error fetching bot:', error);
        setError('Error loading bot information.');
      } finally {
        setIsLoadingBot(false);
      }
    };

    fetchBot();
    loadConversations();
  }, [botId]);

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

  if (isLoadingBot || isLoadingConversations) {
    return (
      <RoleGuard allowedRoles={['user']}>
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6566F1] mx-auto mb-4"></div>
              <p className="text-gray-600">Loading bot and conversations...</p>
            </div>
          </div>
        </div>
      </RoleGuard>
    );
  }

  if (error || !bot) {
    return (
      <RoleGuard allowedRoles={['user']}>
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Bot Not Found</h1>
              <p className="text-gray-600 mb-4">{error || "The bot you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it."}</p>
              <Button 
                onClick={() => router.push('/user-dashboard/bots')}
                className="bg-[#6566F1] hover:bg-[#5A5BD9] text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to My Bots
              </Button>
            </div>
          </div>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={['user']}>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex flex-col overflow-hidden">
      {/* Header with Back Button */}
      <div className="bg-white/95 backdrop-blur-xl border-b border-gray-200/80 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/user-dashboard/bots')}
              className="text-gray-600 hover:text-gray-900 hover:bg-white/80 transition-all duration-200 rounded-lg px-2 py-1.5 text-xs font-medium border border-gray-200/60 hover:border-indigo-300/60 hover:shadow-md"
            >
              <ArrowLeft className="w-3 h-3 mr-1" />
              Back to My Bots
            </Button>
            <div className="h-4 w-px bg-gray-300"></div>
            <span className="text-sm text-gray-500 font-medium">Testing Bot: <span className="text-indigo-600">{bot.name}</span></span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden p-4">
        {/* Bot Info Header - Compact */}
        <div className="mb-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-xl border border-gray-200/80 shadow-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200/50 ring-2 ring-indigo-100/50">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                    bot.status === 'active' ? 'bg-green-500' :
                    bot.status === 'paused' ? 'bg-yellow-500' : 'bg-gray-400'
                  }`}></div>
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent">
                    {bot.name}
                  </h1>
                  <p className="text-sm text-gray-600 font-medium">{bot.domain} • {bot.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${
                  bot.status === 'active'
                    ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200'
                    : bot.status === 'paused'
                    ? 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-200'
                    : 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border border-gray-200'
                }`}>
                  {bot.status === 'active' ? '🟢' : bot.status === 'paused' ? '🟡' : '⚫'} {bot.status.charAt(0).toUpperCase() + bot.status.slice(1)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-white/95 backdrop-blur-xl border border-gray-200/80 shadow-2xl shadow-gray-200/40 flex flex-col flex-1 rounded-2xl overflow-hidden">

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-white via-blue-50/20 to-indigo-50/30">
              {messages.length === 0 ? (
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
                    <span className="px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 rounded-xl text-sm font-semibold shadow-md border border-indigo-200/60">Try asking about {bot.domain}</span>
                    <span className="px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-xl text-sm font-semibold shadow-md border border-purple-200/60">Test different scenarios</span>
                  </div>
                </div>
              ) : (
                messages.map((message) => (
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
                ))
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
            </div>

            {/* Input - Fixed at Bottom */}
            <div className="bg-white/95 backdrop-blur-xl border-t border-gray-200/80 p-4 flex-shrink-0">
              <div className="flex space-x-3">
                <div className="flex-1 relative">
                  <textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message here..."
                    className="w-full pl-4 pr-12 py-3 border-2 border-gray-200/60 rounded-xl focus:border-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus-visible:outline-none transition-all duration-200 bg-white/90 backdrop-blur-sm text-gray-900 placeholder-gray-500 resize-none min-h-[48px] max-h-24 shadow-lg shadow-gray-200/30 text-sm font-medium"
                    disabled={isLoading}
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
                  disabled={!inputMessage.trim() || isLoading}
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
    </RoleGuard>
  );
}

export default function UserTestBotPage() {
  return (
    <Suspense fallback={
      <RoleGuard allowedRoles={['user']}>
        <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6566F1] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </RoleGuard>
    }>
      <UserTestBotPageContent />
    </Suspense>
  );
}
