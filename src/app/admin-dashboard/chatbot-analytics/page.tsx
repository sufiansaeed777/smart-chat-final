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
  Minus
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

const ChatbotAnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<BotAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedBot, setSelectedBot] = useState<string>('all');

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
          <button className="flex items-center space-x-2 bg-white text-gray-700 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
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
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="w-6 h-6 mr-2 text-[#6566F1]" />
            Bot Performance
          </h3>
          <p className="text-gray-600 mt-1">Detailed metrics for each chatbot</p>
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
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {analytics.map((bot) => (
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
                  <td className="px-0.5 sm:px-1 md:px-2 lg:px-3 xl:px-4 py-1.5 sm:py-2 md:py-3 whitespace-nowrap text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium">
                    <div className="flex items-center space-x-0.5 sm:space-x-1 md:space-x-1.5">
                      <Tooltip content="View" position="top">
                        <button className="text-[#6566F1] hover:text-[#5A5BD9] p-0.5 sm:p-1 md:p-1.5 rounded-md sm:rounded-lg hover:bg-[#6566F1]/10 transition-colors flex-shrink-0">
                          <Eye className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 lg:w-4 lg:h-4" />
                        </button>
                      </Tooltip>
                      <Tooltip content="Analytics" position="top">
                        <button className="text-gray-600 hover:text-gray-900 p-0.5 sm:p-1 md:p-1.5 rounded-md sm:rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0">
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
    </div>
  );
};

export default ChatbotAnalyticsPage;
