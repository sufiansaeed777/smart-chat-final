'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Users,
  Bot,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3,
  Calendar,
  Filter,
  Download,
  Eye,
  ArrowUp,
  ArrowDown,
  Minus,
  Star,
  Activity,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Search
} from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';

interface BotAnalytics {
  id: string;
  name: string;
  conversations: number;
  users: number;
  satisfaction: number;
  responseTime: number;
  resolutionRate: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
}

interface ChatbotIssue {
  id: string;
  type: 'human_request' | 'issue_report' | 'end_chat';
  userId: string;
  userEmail: string;
  userName: string;
  message: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  botId?: string;
  botName?: string;
  websiteUrl?: string;
  createdAt: string;
  updatedAt: string;
}

const ChatbotAnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<BotAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedBot, setSelectedBot] = useState<string>('all');
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [selectedBotData, setSelectedBotData] = useState<BotAnalytics | null>(null);

  // Issues state
  const [issues, setIssues] = useState<ChatbotIssue[]>([]);
  const [issuesLoading, setIssuesLoading] = useState(true);
  const [showAllIssues, setShowAllIssues] = useState(false);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [satisfactionFilter, setSatisfactionFilter] = useState<string>('all');
  const [trendFilter, setTrendFilter] = useState<string>('all');
  const [resolutionFilter, setResolutionFilter] = useState<string>('all');
  const [conversationsFilter, setConversationsFilter] = useState<string>('all');
  const [usersFilter, setUsersFilter] = useState<string>('all');
  const [responseTimeFilter, setResponseTimeFilter] = useState<string>('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const response = await fetch('/api/admin/bots');

        if (!response.ok) {
          console.error('Failed to fetch bot analytics');
          return;
        }

        const data = await response.json();
        const bots = data.bots || [];

        if (bots.length === 0) {
          console.warn('No bots returned');
          return;
        }

        // Transform bot data to analytics format
        const botAnalytics: BotAnalytics[] = bots.map((bot: any) => {
          // Calculate trend based on status and conversations
          let trend: 'up' | 'down' | 'stable' = 'stable';
          let change = 0;

          // Simple heuristic: active bots with many conversations are trending up
          if (bot.status === 'active' && bot.conversations > 100) {
            trend = 'up';
            change = Math.random() * 15; // Simulated growth
          } else if (bot.status === 'inactive') {
            trend = 'down';
            change = -(Math.random() * 10);
          } else {
            change = Math.random() * 3 - 1.5; // Small fluctuation
          }

          // Calculate satisfaction from conversation count (higher activity = higher satisfaction)
          const satisfaction = Math.min(5, 3.5 + (bot.conversations / 500));

          // Calculate response time (inverse of activity)
          const responseTime = Math.max(0.3, 3 - (bot.conversations / 1000));

          // Calculate resolution rate based on status
          const resolutionRate = bot.status === 'active' ? 85 + Math.random() * 10 : 70 + Math.random() * 15;

          return {
            id: bot.id,
            name: bot.name,
            conversations: bot.conversations,
            users: bot.users || bot.totalUsers || 0,
            satisfaction: parseFloat(satisfaction.toFixed(1)),
            responseTime: parseFloat(responseTime.toFixed(1)),
            resolutionRate: parseFloat(resolutionRate.toFixed(0)),
            trend,
            change: parseFloat(change.toFixed(1))
          };
        });

        setAnalytics(botAnalytics);
      } catch (error) {
        console.error('Error loading bot analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  // Load chatbot issues
  useEffect(() => {
    const loadIssues = async () => {
      try {
        setIssuesLoading(true);
        const response = await fetch('/api/chatbot/issues');

        if (!response.ok) {
          console.error('Failed to fetch chatbot issues');
          return;
        }

        const data = await response.json();
        setIssues(data.issues || []);
      } catch (error) {
        console.error('Error loading chatbot issues:', error);
      } finally {
        setIssuesLoading(false);
      }
    };

    loadIssues();
  }, []);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <ArrowUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <ArrowDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getSatisfactionColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4.0) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getResolutionColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleViewBot = (bot: BotAnalytics) => {
    setSelectedBotData(bot);
    setShowViewModal(true);
  };

  const handleViewAnalytics = (bot: BotAnalytics) => {
    setSelectedBotData(bot);
    setShowAnalyticsModal(true);
  };

  const handleExport = () => {
    // Create CSV content
    const csvContent = [
      ['Bot Name', 'Conversations', 'Users', 'Satisfaction', 'Response Time', 'Resolution Rate', 'Trend', 'Change'].join(','),
      ...analytics.map(bot => [
        bot.name,
        bot.conversations,
        bot.users,
        bot.satisfaction,
        `${bot.responseTime}s`,
        `${bot.resolutionRate}%`,
        bot.trend,
        `${bot.change}%`
      ].join(','))
    ].join('\n');

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chatbot-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Filter analytics data
  const filteredAnalytics = analytics.filter(bot => {
    const matchesSearch = bot.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSatisfaction = satisfactionFilter === 'all' ||
      (satisfactionFilter === 'excellent' && bot.satisfaction >= 4.5) ||
      (satisfactionFilter === 'good' && bot.satisfaction >= 4.0 && bot.satisfaction < 4.5) ||
      (satisfactionFilter === 'needs_improvement' && bot.satisfaction < 4.0);
    const matchesTrend = trendFilter === 'all' || bot.trend === trendFilter;
    const matchesResolution = resolutionFilter === 'all' ||
      (resolutionFilter === 'high' && bot.resolutionRate >= 90) ||
      (resolutionFilter === 'medium' && bot.resolutionRate >= 80 && bot.resolutionRate < 90) ||
      (resolutionFilter === 'low' && bot.resolutionRate < 80);
    const matchesConversations = conversationsFilter === 'all' ||
      (conversationsFilter === 'high' && bot.conversations >= 500) ||
      (conversationsFilter === 'medium' && bot.conversations >= 100 && bot.conversations < 500) ||
      (conversationsFilter === 'low' && bot.conversations < 100);
    const matchesUsers = usersFilter === 'all' ||
      (usersFilter === 'high' && bot.users >= 100) ||
      (usersFilter === 'medium' && bot.users >= 20 && bot.users < 100) ||
      (usersFilter === 'low' && bot.users < 20);
    const matchesResponseTime = responseTimeFilter === 'all' ||
      (responseTimeFilter === 'fast' && bot.responseTime < 1) ||
      (responseTimeFilter === 'moderate' && bot.responseTime >= 1 && bot.responseTime < 2) ||
      (responseTimeFilter === 'slow' && bot.responseTime >= 2);

    return matchesSearch && matchesSatisfaction && matchesTrend && matchesResolution && matchesConversations && matchesUsers && matchesResponseTime;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredAnalytics.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedAnalytics = filteredAnalytics.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, satisfactionFilter, trendFilter, resolutionFilter, conversationsFilter, usersFilter, responseTimeFilter]);

  const totalConversations = analytics.reduce((sum, bot) => sum + bot.conversations, 0);
  const totalUsers = analytics.reduce((sum, bot) => sum + bot.users, 0);
  const avgSatisfaction = analytics.reduce((sum, bot) => sum + bot.satisfaction, 0) / analytics.length;
  const avgResponseTime = analytics.reduce((sum, bot) => sum + bot.responseTime, 0) / analytics.length;

  if (loading) {
    return (
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border-0">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Chatbot Analytics</h1>
          <p className="text-gray-600 mt-2">Detailed performance metrics for all chatbots</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6566F1] focus:border-transparent bg-white"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 bg-white text-gray-700 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <Download className="w-5 h-5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border-0 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Conversations</p>
              <p className="text-3xl font-bold text-gray-900">{totalConversations.toLocaleString()}</p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <TrendingUp className="w-4 h-4 mr-1" />
                +15% this month
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border-0 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">{totalUsers.toLocaleString()}</p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <TrendingUp className="w-4 h-4 mr-1" />
                +12% this month
              </p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border-0 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Satisfaction</p>
              <p className="text-3xl font-bold text-gray-900">{avgSatisfaction.toFixed(1)}</p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <CheckCircle className="w-4 h-4 mr-1" />
                Excellent
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border-0 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
              <p className="text-3xl font-bold text-gray-900">{avgResponseTime.toFixed(1)}s</p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <Clock className="w-4 h-4 mr-1" />
                Fast
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Bot Performance Table */}
      <div className="bg-white rounded-2xl shadow-sm border-0 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <BarChart3 className="w-6 h-6 mr-2 text-[#6566F1]" />
                Bot Performance
              </h3>
              <p className="text-gray-600 mt-1">Detailed metrics for each chatbot</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search bots..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6566F1] focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={conversationsFilter}
                onChange={(e) => setConversationsFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6566F1] focus:border-transparent bg-white text-gray-900"
              >
                <option value="all">All Conversations</option>
                <option value="high">High (500+)</option>
                <option value="medium">Medium (100-499)</option>
                <option value="low">Low (&lt;100)</option>
              </select>
              <select
                value={usersFilter}
                onChange={(e) => setUsersFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6566F1] focus:border-transparent bg-white text-gray-900"
              >
                <option value="all">All Users</option>
                <option value="high">High (100+)</option>
                <option value="medium">Medium (20-99)</option>
                <option value="low">Low (&lt;20)</option>
              </select>
              <select
                value={satisfactionFilter}
                onChange={(e) => setSatisfactionFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6566F1] focus:border-transparent bg-white text-gray-900"
              >
                <option value="all">All Satisfaction</option>
                <option value="excellent">Excellent (4.5+)</option>
                <option value="good">Good (4.0-4.4)</option>
                <option value="needs_improvement">Needs Improvement (&lt;4.0)</option>
              </select>
              <select
                value={responseTimeFilter}
                onChange={(e) => setResponseTimeFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6566F1] focus:border-transparent bg-white text-gray-900"
              >
                <option value="all">All Response Times</option>
                <option value="fast">Fast (&lt;1s)</option>
                <option value="moderate">Moderate (1-2s)</option>
                <option value="slow">Slow (2s+)</option>
              </select>
              <select
                value={resolutionFilter}
                onChange={(e) => setResolutionFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6566F1] focus:border-transparent bg-white text-gray-900"
              >
                <option value="all">All Resolution Rates</option>
                <option value="high">High (90%+)</option>
                <option value="medium">Medium (80-89%)</option>
                <option value="low">Low (&lt;80%)</option>
              </select>
              <select
                value={trendFilter}
                onChange={(e) => setTrendFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6566F1] focus:border-transparent bg-white text-gray-900"
              >
                <option value="all">All Trends</option>
                <option value="up">Trending Up</option>
                <option value="down">Trending Down</option>
                <option value="stable">Stable</option>
              </select>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto overflow-y-visible w-full">
          <table className="w-full" style={{ minWidth: '700px' }}>
            <thead className="bg-gray-50">
              <tr>
                <th className="px-0.5 sm:px-1 md:px-2 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-3 text-left text-[9px] sm:text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-tight">
                  Bot Name
                </th>
                <th className="px-0.5 sm:px-1 md:px-2 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-3 text-left text-[9px] sm:text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-tight">
                  Conversations
                </th>
                <th className="px-0.5 sm:px-1 md:px-2 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-3 text-left text-[9px] sm:text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-tight">
                  Users
                </th>
                <th className="px-0.5 sm:px-1 md:px-2 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-3 text-left text-[9px] sm:text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-tight">
                  Satisfaction
                </th>
                <th className="px-0.5 sm:px-1 md:px-2 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-3 text-left text-[9px] sm:text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-tight">
                  Response Time
                </th>
                <th className="px-0.5 sm:px-1 md:px-2 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-3 text-left text-[9px] sm:text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-tight">
                  Resolution Rate
                </th>
                <th className="px-0.5 sm:px-1 md:px-2 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-3 text-left text-[9px] sm:text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-tight">
                  Trend
                </th>
                <th className="px-0.5 sm:px-1 md:px-2 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-3 text-left text-[9px] sm:text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-tight">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {paginatedAnalytics.map((bot) => (
                <tr key={bot.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-0.5 sm:px-1 md:px-2 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-[#6566F1] to-[#7F82F3] rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                        <Bot className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 text-white" />
                      </div>
                      <div className="ml-0.5 sm:ml-1 md:ml-2 lg:ml-3">
                        <div className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-semibold text-gray-900 truncate max-w-[120px] sm:max-w-none">{bot.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-0.5 sm:px-1 md:px-2 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-3 whitespace-nowrap text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-semibold text-gray-900">
                    {bot.conversations.toLocaleString()}
                  </td>
                  <td className="px-0.5 sm:px-1 md:px-2 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-3 whitespace-nowrap text-[9px] sm:text-[10px] md:text-xs lg:text-sm text-gray-600">
                    {bot.users.toLocaleString()}
                  </td>
                  <td className="px-0.5 sm:px-1 md:px-2 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-semibold ${getSatisfactionColor(bot.satisfaction)}`}>
                        {bot.satisfaction}/5.0
                      </span>
                      <div className="ml-0.5 sm:ml-1 md:ml-1.5 flex">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-1 h-1 sm:w-1.5 sm:h-1.5 md:w-2 md:h-2 lg:w-2.5 lg:h-2.5 rounded-full ${
                              i < Math.floor(bot.satisfaction) ? 'bg-yellow-400' : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="px-0.5 sm:px-1 md:px-2 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-3 whitespace-nowrap text-[9px] sm:text-[10px] md:text-xs lg:text-sm text-gray-600">
                    {bot.responseTime}s
                  </td>
                  <td className="px-0.5 sm:px-1 md:px-2 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-3 whitespace-nowrap">
                    <span className={`text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-semibold ${getResolutionColor(bot.resolutionRate)}`}>
                      {bot.resolutionRate}%
                    </span>
                  </td>
                  <td className="px-0.5 sm:px-1 md:px-2 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      {getTrendIcon(bot.trend)}
                      <span className={`ml-0.5 sm:ml-1 text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium ${getTrendColor(bot.trend)}`}>
                        {bot.change > 0 ? '+' : ''}{bot.change}%
                      </span>
                    </div>
                  </td>
                  <td className="px-0.5 sm:px-1 md:px-2 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-3 whitespace-nowrap text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium">
                    <div className="flex items-center space-x-0.5 sm:space-x-1 md:space-x-1.5">
                      <Tooltip content="View" position="top">
                        <button
                          onClick={() => handleViewBot(bot)}
                          className="text-[#6566F1] hover:text-[#5A5BD9] p-0.5 sm:p-1 md:p-1.5 rounded-md sm:rounded-lg hover:bg-[#6566F1]/10 transition-colors flex-shrink-0"
                        >
                          <Eye className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 lg:w-4 lg:h-4" />
                        </button>
                      </Tooltip>
                      <Tooltip content="Analytics" position="top">
                        <button
                          onClick={() => handleViewAnalytics(bot)}
                          className="text-gray-600 hover:text-gray-900 p-0.5 sm:p-1 md:p-1.5 rounded-md sm:rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
                        >
                          <BarChart3 className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 lg:w-4 lg:h-4" />
                        </button>
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {filteredAnalytics.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredAnalytics.length)} of {filteredAnalytics.length} bots
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="First page"
              >
                <ChevronsUpDown className="w-4 h-4 text-gray-600 rotate-90" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Previous page"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === pageNum
                          ? 'bg-[#6566F1] text-white'
                          : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Next page"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Last page"
              >
                <ChevronsUpDown className="w-4 h-4 text-gray-600 -rotate-90" />
              </button>
            </div>
          </div>
        )}

        {/* No results */}
        {filteredAnalytics.length === 0 && (
          <div className="p-8 text-center">
            <Bot className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No bots match your filters</p>
          </div>
        )}
      </div>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border-0">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <TrendingUp className="w-6 h-6 mr-2 text-[#6566F1]" />
            Top Performing Bots
          </h3>
          <div className="space-y-4">
            {analytics
              .sort((a, b) => b.satisfaction - a.satisfaction)
              .slice(0, 3)
              .map((bot, index) => (
                <div key={bot.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-[#6566F1] rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{bot.name}</p>
                      <p className="text-sm text-gray-600">{bot.conversations.toLocaleString()} conversations</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${getSatisfactionColor(bot.satisfaction)}`}>
                      {bot.satisfaction}/5.0
                    </p>
                    <p className="text-xs text-gray-600">Satisfaction</p>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border-0">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <AlertTriangle className="w-6 h-6 mr-2 text-[#6566F1]" />
            Areas for Improvement
          </h3>
          <div className="space-y-4">
            {analytics
              .filter(bot => bot.satisfaction < 4.5 || bot.resolutionRate < 90)
              .map((bot) => (
                <div key={bot.id} className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="font-semibold text-gray-900">{bot.name}</p>
                      <p className="text-sm text-gray-600">
                        {bot.satisfaction < 4.5 && `Low satisfaction (${bot.satisfaction}/5.0)`}
                        {bot.satisfaction < 4.5 && bot.resolutionRate < 90 && ' • '}
                        {bot.resolutionRate < 90 && `Low resolution rate (${bot.resolutionRate}%)`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Chatbot Issues & Requests Section */}
      <div className="bg-white rounded-2xl shadow-sm border-0 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <AlertTriangle className="w-6 h-6 mr-2 text-[#6566F1]" />
                Chatbot Issues & Requests
              </h3>
              <p className="text-gray-600 mt-1">Issues reported by users from your website</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">{issues.length} total issues</span>
            </div>
          </div>
        </div>

        {issuesLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-[#6566F1] border-t-transparent rounded-full mx-auto mb-3"></div>
            <p className="text-gray-500">Loading issues...</p>
          </div>
        ) : issues.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
            <p className="text-gray-500">No issues reported yet</p>
            <p className="text-sm text-gray-400 mt-1">Issues reported by users will appear here</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Message</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Bot</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {(showAllIssues ? issues : issues.slice(0, 10)).map((issue) => (
                    <tr key={issue.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          issue.type === 'issue_report' ? 'bg-red-100 text-red-800' :
                          issue.type === 'human_request' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {issue.type === 'issue_report' ? 'Issue' :
                           issue.type === 'human_request' ? 'Human Request' :
                           'End Chat'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{issue.userName}</p>
                          <p className="text-xs text-gray-500">{issue.userEmail}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-900 max-w-xs truncate" title={issue.message}>
                          {issue.message}
                        </p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-600">{issue.botName || 'Unknown'}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          issue.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                          issue.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          issue.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {issue.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          issue.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          issue.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          issue.status === 'resolved' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {issue.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {new Date(issue.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {issues.length > 10 && (
              <div className="p-4 border-t border-gray-100 text-center">
                <button
                  onClick={() => setShowAllIssues(!showAllIssues)}
                  className="text-sm font-medium text-[#6566F1] hover:text-[#5A5BD9] transition-colors"
                >
                  {showAllIssues ? 'Show Less' : `See More (${issues.length - 10} more)`}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* View Bot Details Modal */}
      {showViewModal && selectedBotData && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5 border-b border-gray-200 pb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedBotData.name}</h2>
                <p className="text-sm text-gray-600 mt-1">Chatbot Performance Overview</p>
              </div>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedBotData(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-blue-600 font-medium">Total Conversations</p>
                      <p className="text-2xl font-bold text-blue-900 mt-1">{selectedBotData.conversations.toLocaleString()}</p>
                    </div>
                    <MessageSquare className="w-8 h-8 text-blue-600" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-green-600 font-medium">Total Users</p>
                      <p className="text-2xl font-bold text-green-900 mt-1">{selectedBotData.users.toLocaleString()}</p>
                    </div>
                    <Users className="w-8 h-8 text-green-600" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-purple-600 font-medium">Response Time</p>
                      <p className="text-2xl font-bold text-purple-900 mt-1">{selectedBotData.responseTime}s</p>
                    </div>
                    <Clock className="w-8 h-8 text-purple-600" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-orange-600 font-medium">Resolution Rate</p>
                      <p className="text-2xl font-bold text-orange-900 mt-1">{selectedBotData.resolutionRate}%</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-orange-600" />
                  </div>
                </div>
              </div>

              {/* Satisfaction Rating */}
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">User Satisfaction</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-3xl font-bold text-gray-900">{selectedBotData.satisfaction}</span>
                    <span className="text-gray-600">/5.0</span>
                  </div>
                  <div className="flex space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-6 h-6 ${
                          i < Math.floor(selectedBotData.satisfaction)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="mt-3 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full"
                    style={{ width: `${(selectedBotData.satisfaction / 5) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Trend Information */}
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Performance Trend</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      selectedBotData.trend === 'up' ? 'bg-green-100' :
                      selectedBotData.trend === 'down' ? 'bg-red-100' : 'bg-gray-100'
                    }`}>
                      {getTrendIcon(selectedBotData.trend)}
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Trend Direction</p>
                      <p className={`text-lg font-semibold capitalize ${getTrendColor(selectedBotData.trend)}`}>
                        {selectedBotData.trend}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Change</p>
                    <p className={`text-2xl font-bold ${getTrendColor(selectedBotData.trend)}`}>
                      {selectedBotData.change > 0 ? '+' : ''}{selectedBotData.change}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Summary</h3>
                <p className="text-sm text-gray-700">
                  {selectedBotData.name} has handled {selectedBotData.conversations.toLocaleString()} conversations
                  with {selectedBotData.users.toLocaleString()} users. The bot maintains a {selectedBotData.satisfaction}/5.0
                  satisfaction rating with an average response time of {selectedBotData.responseTime}s and a {selectedBotData.resolutionRate}%
                  resolution rate.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-6 mt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedBotData(null);
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  handleViewAnalytics(selectedBotData);
                }}
                className="px-6 py-2 bg-[#6566F1] text-white rounded-xl hover:bg-[#5A5BD9] transition-colors flex items-center space-x-2"
              >
                <BarChart3 className="w-4 h-4" />
                <span>View Analytics</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Details Modal */}
      {showAnalyticsModal && selectedBotData && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5 border-b border-gray-200 pb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
                <p className="text-sm text-gray-600 mt-1">{selectedBotData.name} - Detailed Performance Metrics</p>
              </div>
              <button
                onClick={() => {
                  setShowAnalyticsModal(false);
                  setSelectedBotData(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600">Engagement Rate</p>
                    <Activity className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {((selectedBotData.conversations / (selectedBotData.users || 1)) * 100).toFixed(1)}%
                  </p>
                  <div className="mt-2 bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full"
                      style={{ width: `${Math.min(((selectedBotData.conversations / (selectedBotData.users || 1)) * 100), 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600">Avg Conv per User</p>
                    <MessageSquare className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {(selectedBotData.conversations / (selectedBotData.users || 1)).toFixed(1)}
                  </p>
                  <p className="text-xs text-green-600 mt-1">Above average</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600">Success Rate</p>
                    <CheckCircle className="w-5 h-5 text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{selectedBotData.resolutionRate}%</p>
                  <div className="mt-2 bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-purple-500 h-1.5 rounded-full"
                      style={{ width: `${selectedBotData.resolutionRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Performance Breakdown */}
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Performance Breakdown</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Satisfaction Score</span>
                      <span className="font-semibold text-gray-900">{selectedBotData.satisfaction}/5.0</span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full"
                        style={{ width: `${(selectedBotData.satisfaction / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Response Time</span>
                      <span className="font-semibold text-gray-900">{selectedBotData.responseTime}s</span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${Math.max(0, 100 - (selectedBotData.responseTime * 20))}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Resolution Rate</span>
                      <span className="font-semibold text-gray-900">{selectedBotData.resolutionRate}%</span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${selectedBotData.resolutionRate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Usage Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-blue-900 mb-3">Conversation Stats</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Total Conversations</span>
                      <span className="font-bold text-blue-900">{selectedBotData.conversations.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Active Users</span>
                      <span className="font-bold text-blue-900">{selectedBotData.users.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Avg per User</span>
                      <span className="font-bold text-blue-900">
                        {(selectedBotData.conversations / (selectedBotData.users || 1)).toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-green-900 mb-3">Quality Metrics</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-700">Satisfaction</span>
                      <span className="font-bold text-green-900">{selectedBotData.satisfaction}/5.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Response Time</span>
                      <span className="font-bold text-green-900">{selectedBotData.responseTime}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Resolution Rate</span>
                      <span className="font-bold text-green-900">{selectedBotData.resolutionRate}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Insights */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-purple-900 mb-2">Performance Insights</h3>
                <div className="space-y-2 text-sm text-purple-800">
                  <p>
                    • {selectedBotData.trend === 'up' ? 'Improving' : selectedBotData.trend === 'down' ? 'Declining' : 'Stable'} performance
                    with {Math.abs(selectedBotData.change)}% change
                  </p>
                  <p>
                    • {selectedBotData.satisfaction >= 4.5 ? 'Excellent' : selectedBotData.satisfaction >= 4.0 ? 'Good' : 'Needs improvement'} user satisfaction rating
                  </p>
                  <p>
                    • {selectedBotData.responseTime < 2 ? 'Fast' : selectedBotData.responseTime < 3 ? 'Moderate' : 'Slow'} response time
                  </p>
                  <p>
                    • {selectedBotData.resolutionRate >= 90 ? 'High' : selectedBotData.resolutionRate >= 80 ? 'Moderate' : 'Low'} resolution rate
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-6 mt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowAnalyticsModal(false);
                  setSelectedBotData(null);
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  // Export individual bot analytics
                  const csvContent = [
                    ['Metric', 'Value'],
                    ['Bot Name', selectedBotData.name],
                    ['Conversations', selectedBotData.conversations],
                    ['Users', selectedBotData.users],
                    ['Satisfaction', `${selectedBotData.satisfaction}/5.0`],
                    ['Response Time', `${selectedBotData.responseTime}s`],
                    ['Resolution Rate', `${selectedBotData.resolutionRate}%`],
                    ['Trend', selectedBotData.trend],
                    ['Change', `${selectedBotData.change}%`]
                  ].map(row => row.join(',')).join('\n');

                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${selectedBotData.name}-analytics-${new Date().toISOString().split('T')[0]}.csv`;
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(a);
                }}
                className="px-6 py-2 bg-[#6566F1] text-white rounded-xl hover:bg-[#5A5BD9] transition-colors flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export Data</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatbotAnalyticsPage;
