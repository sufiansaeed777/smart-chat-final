'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  MessageCircle,
  X,
  Send,
  User,
  Bot,
  HelpCircle,
  AlertTriangle
} from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatBotProps {
  apiKey?: string; // Made optional since we're not using it anymore
  externalTrigger?: boolean; // External trigger to open chat
  onTriggered?: () => void; // Callback when triggered externally
}

const ChatBot: React.FC<ChatBotProps> = ({ apiKey, externalTrigger, onTriggered }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi there! 👋 I'm here to help you with any questions. How can I assist you today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showReportIssue, setShowReportIssue] = useState(false);
  const [showEndChatConfirm, setShowEndChatConfirm] = useState(false);
  const [userMessageCount, setUserMessageCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle external trigger to open chat
  useEffect(() => {
    if (externalTrigger) {
      setIsOpen(true);
      onTriggered?.();
    }
  }, [externalTrigger, onTriggered]);

  // Handle escape key to close modals
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showReportIssue) {
          setShowReportIssue(false);
        }
        if (showEndChatConfirm) {
          setShowEndChatConfirm(false);
        }
      }
    };

    if (showReportIssue || showEndChatConfirm) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => {
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
  }, [showReportIssue, showEndChatConfirm]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setUserMessageCount(prev => prev + 1);
    setInputValue('');
    setIsLoading(true);

    try {
      // Use the same N8N webhook as the test bot pages
      const response = await fetch('/api/chat/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          botId: 'general-assistant', // Use a general bot ID for the main chatbot
          message: inputValue,
          userId: 'guest-user', // For guest users
          isTestMessage: true // Flag to identify test messages
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: data.response || "I understand what you're looking for. Here's what I can tell you about that topic...",
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error('Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I'm having trouble processing your request right now. Please try again later.",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleReportIssue = () => {
    setShowReportIssue(true);
  };

  const handleEndChatClick = () => {
    setShowEndChatConfirm(true);
  };

  const handleEndChatConfirm = async () => {
    try {
      // Send end chat issue to API
      await fetch('/api/chatbot/issues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'end_chat',
          userId: 'guest-user',
          userEmail: 'guest@example.com',
          userName: 'Guest User',
          message: 'User ended chat session',
          priority: 'low',
          botId: 'general-assistant'
        }),
      });
    } catch (error) {
      console.error('Error logging end chat:', error);
    }
    
    setShowEndChatConfirm(false);
    setIsOpen(false);
    setMessages([{
      id: '1',
      text: "Hi there! 👋 I'm here to help you with any questions. How can I assist you today?",
      sender: 'bot',
      timestamp: new Date()
    }]);
    setUserMessageCount(0);
  };

  const handleReportSubmit = async (issueType: string, description: string, email: string) => {
    try {
      await fetch('/api/chatbot/issues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'issue_report',
          userId: 'guest-user',
          userEmail: email || 'guest@example.com',
          userName: 'Guest User',
          message: `${issueType}: ${description}`,
          priority: 'medium',
          botId: 'general-assistant'
        }),
      });
      setShowReportIssue(false);
    } catch (error) {
      console.error('Error reporting issue:', error);
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-[#6566F1] hover:bg-[#5A5BD8] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-50"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[420px] h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col">
          {/* Header */}
          <div className="bg-[#6566F1] text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5 text-[#6566F1]" />
              </div>
              <div>
                <h3 className="font-semibold">AI Assistant</h3>
                <p className="text-sm text-blue-100">We&apos;re here to help!</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-1 hover:bg-blue-600 rounded">
                <HelpCircle className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-blue-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-2 max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.sender === 'user' 
                      ? 'bg-gray-300' 
                      : 'bg-white border border-gray-200'
                  }`}>
                    {message.sender === 'user' ? (
                      <User className="w-4 h-4 text-gray-600" />
                    ) : (
                      <Bot className="w-4 h-4 text-[#6566F1]" />
                    )}
                  </div>
                  <div className={`px-3 py-2 rounded-2xl ${
                    message.sender === 'user'
                      ? 'bg-[#6566F1] text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className={`text-sm ${
                      message.sender === 'user' ? 'text-white' : 'text-gray-900'
                    }`}>{message.text}</p>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-[#6566F1]" />
                  </div>
                  <div className="bg-gray-100 px-3 py-2 rounded-2xl">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Section */}
          <div className="px-4 py-2 border-t border-gray-200">
            {/* Report Issue - Only shows after 5 messages */}
            {userMessageCount >= 5 && (
              <div className="mb-2">
                <button
                  onClick={handleReportIssue}
                  className="flex items-center justify-center gap-1 w-full px-3 py-2 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <AlertTriangle className="w-3 h-3 text-gray-500" />
                  <span>Report an Issue</span>
                </button>
              </div>
            )}

            {/* Input with End Chat and Send buttons */}
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6566F1] focus:border-transparent text-gray-900 placeholder-gray-500"
                disabled={isLoading}
              />
              <button
                onClick={handleEndChatClick}
                className="px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
                title="End Chat"
              >
                End
              </button>
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="w-10 h-10 bg-[#6566F1] hover:bg-[#5A5BD8] text-white rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-gray-500 mt-2">
              Privacy • GDPR
            </div>
          </div>
        </div>
      )}

      {/* End Chat Confirmation Modal */}
      {showEndChatConfirm && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-60">
          <div className="bg-white rounded-2xl p-6 w-[360px] max-w-[90vw] shadow-2xl border border-gray-100">
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-6 h-6 text-gray-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">End Chat</h3>
              <p className="text-gray-600 mb-6">Your chat will be ended.</p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowEndChatConfirm(false)}
                  className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors font-medium border border-gray-300 rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEndChatConfirm}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-xl transition-colors font-medium"
                >
                  End Chat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Issue Modal */}
      {showReportIssue && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-60">
          <div className="bg-white rounded-2xl p-6 w-[520px] max-w-[90vw] shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Report an Issue</h3>
                  <p className="text-sm text-gray-600">Help us improve by reporting problems</p>
                </div>
              </div>
              <button
                onClick={() => setShowReportIssue(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-200">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
                <div>
                  <p className="text-sm text-red-800 font-medium mb-1">Help us improve!</p>
                  <p className="text-sm text-red-700">
                    Your feedback helps us fix bugs, improve features, and create a better experience for everyone.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Issue Type *
                </label>
                <select className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6566F1] focus:border-transparent text-gray-900 transition-all duration-200">
                  <option>Select issue type...</option>
                  <option>Technical Problem</option>
                  <option>Feature Request</option>
                  <option>Bug Report</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Description *
                </label>
                <textarea
                  placeholder="What happened? What did you expect to happen? Please provide as much detail as possible..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6566F1] focus:border-transparent resize-none text-gray-900 placeholder-gray-500 transition-all duration-200"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Email (for updates)
                </label>
                <input
                  type="email"
                  placeholder="your.email@example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6566F1] focus:border-transparent text-gray-900 placeholder-gray-500 transition-all duration-200"
                />
                <p className="text-xs text-gray-500 mt-2">We&apos;ll use this to send you updates about your report.</p>
              </div>
            </div>

            <div className="flex space-x-3 mt-8">
              <button
                onClick={() => {
                  const issueTypeElement = document.querySelector('select') as HTMLSelectElement;
                  const descriptionElement = document.querySelector('textarea[placeholder*="What happened"]') as HTMLTextAreaElement;
                  const emailElement = document.querySelector('input[type="email"]') as HTMLInputElement;
                  
                  const issueType = issueTypeElement?.value || 'Other';
                  const description = descriptionElement?.value || '';
                  const email = emailElement?.value || '';
                  
                  if (description.trim()) {
                    handleReportSubmit(issueType, description, email);
                  }
                }}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 px-6 rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Report Issue
              </button>
              <button
                onClick={() => setShowReportIssue(false)}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors font-medium border border-gray-300 rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;
