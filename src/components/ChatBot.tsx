'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, 
  X, 
  Send, 
  User, 
  Bot, 
  HelpCircle, 
  AlertTriangle,
  Clock,
  CheckCircle
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
  const [showRequestHuman, setShowRequestHuman] = useState(false);
  const [showReportIssue, setShowReportIssue] = useState(false);
  const [agentRequestSent, setAgentRequestSent] = useState(false);
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
        if (showRequestHuman) {
          setShowRequestHuman(false);
        }
        if (showReportIssue) {
          setShowReportIssue(false);
        }
      }
    };

    if (showRequestHuman || showReportIssue) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => {
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
  }, [showRequestHuman, showReportIssue]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
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

  const handleRequestHuman = async () => {
    setShowRequestHuman(true);
  };

  const handleReportIssue = () => {
    setShowReportIssue(true);
  };

  const handleEndChat = async () => {
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
          priority: 'low'
        }),
      });
    } catch (error) {
      console.error('Error logging end chat:', error);
    }
    
    setIsOpen(false);
    setMessages([{
      id: '1',
      text: "Hi there! 👋 I'm here to help you with any questions. How can I assist you today?",
      sender: 'bot',
      timestamp: new Date()
    }]);
  };

  const handleAgentRequest = async () => {
    try {
      // Get the description from the textarea
      const descriptionElement = document.querySelector('textarea[placeholder*="Describe your issue"]') as HTMLTextAreaElement;
      const description = descriptionElement?.value || 'User requested human agent assistance';

      // Create a conversation record for human handoff
      const handoffResponse = await fetch('/api/conversations/create-handoff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          botId: 'general-assistant', // Use the same bot ID as the chat
          guestName: 'Guest Visitor',
          guestEmail: undefined, // Could collect email in the modal
          initialMessage: description,
          metadata: {
            requestedAt: new Date().toISOString(),
            source: 'chat_widget',
            userAgent: navigator.userAgent
          }
        }),
      });

      if (handoffResponse.ok) {
        const handoffData = await handoffResponse.json();
        console.log('✅ Human handoff conversation created:', handoffData.conversation?.id);
      }

      // Also log to chatbot issues for tracking
      await fetch('/api/chatbot/issues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'human_request',
          userId: 'guest-user',
          userEmail: 'guest@example.com',
          userName: 'Guest User',
          message: description,
          priority: 'high'
        }),
      });

      setAgentRequestSent(true);
      setTimeout(() => {
        setShowRequestHuman(false);
        setAgentRequestSent(false);
      }, 3000);
    } catch (error) {
      console.error('Error requesting agent:', error);
    }
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
          priority: 'medium'
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

          {/* Action Buttons */}
          <div className="px-4 py-2 border-t border-gray-200">
            <div className="flex gap-2 mb-3">
              <button
                onClick={handleRequestHuman}
                className="flex-1 flex items-center justify-center gap-1 px-0.5 py-2 text-xs font-bold text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap min-w-0"
              >
                <User className="w-3 h-3 text-gray-900 flex-shrink-0" />
                <span className="truncate">Request Human</span>
              </button>
              <button
                onClick={handleReportIssue}
                className="flex-1 flex items-center justify-center gap-1 px-0.5 py-2 text-xs font-bold text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap min-w-0"
              >
                <AlertTriangle className="w-3 h-3 text-gray-900 flex-shrink-0" />
                <span className="truncate">Report Issue</span>
              </button>
              <button
                onClick={handleEndChat}
                className="flex-1 px-0.5 py-2 text-xs font-bold text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap min-w-0"
              >
                <span className="truncate">End Chat</span>
              </button>
            </div>

            {/* Input */}
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

                  {/* Request Human Agent Modal */}
            {showRequestHuman && (
              <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-60">
                <div className="bg-white rounded-2xl p-6 w-[480px] max-w-[90vw] shadow-2xl border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-[#6566F1] rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Request Human Agent</h3>
                        <p className="text-sm text-gray-600">Get personalized help from our experts</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowRequestHuman(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

            {!agentRequestSent ? (
              <>
                <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">i</span>
                    </div>
                    <div>
                      <p className="text-sm text-blue-800 font-medium mb-1">Why request a human agent?</p>
                      <p className="text-sm text-blue-700">
                        Our AI handles most questions, but sometimes you need human expertise for complex issues, personalized solutions, or sensitive matters.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    What can our agent help you with?
                  </label>
                  <textarea
                    placeholder="Describe your issue or question to help our agent prepare the best solution for you..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6566F1] focus:border-transparent resize-none text-gray-900 placeholder-gray-500 transition-all duration-200"
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-2">Optional: The more details you provide, the better we can assist you.</p>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleAgentRequest}
                    className="flex-1 bg-[#6566F1] text-white py-3 px-6 rounded-xl hover:bg-[#5A5BD8] transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    Request Agent Now
                  </button>
                  <button
                    onClick={() => setShowRequestHuman(false)}
                    className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors font-medium border border-gray-300 rounded-xl hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Agent Request Sent!</h3>
                <p className="text-gray-700 mb-6 max-w-sm mx-auto">
                  We&apos;ve notified our team and an expert agent will be with you shortly. You&apos;ll receive a notification when they&apos;re ready to help.
                </p>
                <button
                  onClick={() => setShowRequestHuman(false)}
                  className="bg-[#6566F1] hover:bg-[#5A5BD8] text-white py-3 px-8 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Close
                </button>
              </div>
            )}
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
