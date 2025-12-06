'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  MessageSquare,
  Clock,
  Download,
  Calendar,
  Globe,
  MessageCircle,
  Bot,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface BotOption {
  id: string;
  name: string;
}

interface AnalyticsData {
  stats: {
    assignedBots: number;
    totalConversations: number;
    recentConversations: number;
    activeConversations: number;
    avgResponseTime: string;
  };
  chatVolume: Array<{
    date: string;
    conversations: number;
  }>;
  languages: Array<{
    language: string;
    code: string;
    count: number;
    percentage: string;
  }>;
  topQuestions: Array<{
    question: string;
    count: number;
    percentage: string;
  }>;
  engagementTrends: {
    weeklyGrowth: string;
    monthlyGrowth: string;
    averageSessionLength: string;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    bot: string;
    time: string;
    status: string;
  }>;
  availableBots: BotOption[];
}

const COLORS = ['#6566F1', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

const AnalyticsPage = () => {
  const [timeRange, setTimeRange] = useState("7d");
  const [selectedBot, setSelectedBot] = useState("all");
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [selectedBot]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedBot && selectedBot !== 'all') {
        params.append('botId', selectedBot);
      }
      const response = await fetch(`/api/user/analytics?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      } else {
        console.error('Failed to load analytics:', response.statusText);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600 mt-1">
              Track your bot&apos;s performance and insights
            </p>
          </div>
          <div className="flex gap-3">
            <Select value={selectedBot} onValueChange={setSelectedBot}>
              <SelectTrigger className="w-44 border-gray-300 focus:border-[#6566F1] focus:ring-[#6566F1] bg-white rounded-2xl text-gray-900">
                <Bot className="w-4 h-4 mr-2 text-gray-500" />
                <SelectValue placeholder="All Bots" className="text-gray-900" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-gray-900">All Bots</SelectItem>
                {analyticsData?.availableBots?.map((bot) => (
                  <SelectItem key={bot.id} value={bot.id} className="text-gray-900">
                    {bot.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32 border-gray-300 focus:border-[#6566F1] focus:ring-[#6566F1] bg-white rounded-2xl text-gray-900">
                <SelectValue className="text-gray-900" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h" className="text-gray-900">Last 24h</SelectItem>
                <SelectItem value="7d" className="text-gray-900">Last 7 days</SelectItem>
                <SelectItem value="30d" className="text-gray-900">Last 30 days</SelectItem>
                <SelectItem value="90d" className="text-gray-900">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button className="bg-[#6566F1] hover:bg-[#5A5BD8] text-white rounded-2xl">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border border-gray-200 bg-white rounded-2xl">
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-20 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border border-gray-200 bg-white rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Bot className="w-5 h-5 text-[#6566F1]" />
                  <div>
                    <p className="text-2xl font-bold">{analyticsData?.stats.assignedBots || 0}</p>
                    <p className="text-sm text-gray-600">Assigned Bots</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 bg-white rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{analyticsData?.stats.totalConversations || 0}</p>
                    <p className="text-sm text-gray-600">Total Conversations</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 bg-white rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">{analyticsData?.stats.recentConversations || 0}</p>
                    <p className="text-sm text-gray-600">Last 7 Days</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 bg-white rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="text-2xl font-bold">{analyticsData?.stats.avgResponseTime || '0 min'}</p>
                    <p className="text-sm text-gray-600">Avg Response Time</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Engagement Trends */}
        {!loading && analyticsData?.engagementTrends && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border border-gray-200 bg-white rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Weekly Growth</p>
                    <p className="text-2xl font-bold">{analyticsData.engagementTrends.weeklyGrowth}%</p>
                  </div>
                  {parseFloat(analyticsData.engagementTrends.weeklyGrowth) >= 0 ? (
                    <ArrowUpRight className="w-8 h-8 text-green-500" />
                  ) : (
                    <ArrowDownRight className="w-8 h-8 text-red-500" />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 bg-white rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Monthly Growth</p>
                    <p className="text-2xl font-bold">{analyticsData.engagementTrends.monthlyGrowth}%</p>
                  </div>
                  {parseFloat(analyticsData.engagementTrends.monthlyGrowth) >= 0 ? (
                    <ArrowUpRight className="w-8 h-8 text-green-500" />
                  ) : (
                    <ArrowDownRight className="w-8 h-8 text-red-500" />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 bg-white rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Avg Session Length</p>
                    <p className="text-2xl font-bold">{analyticsData.engagementTrends.averageSessionLength}</p>
                  </div>
                  <Clock className="w-8 h-8 text-[#6566F1]" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Chat Volume Chart */}
        <Card className="border border-gray-200 bg-white rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Chat Volume Over Time</span>
            </CardTitle>
            <CardDescription>Conversation trends over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-pulse text-gray-400">Loading chart...</div>
              </div>
            ) : analyticsData?.chatVolume && analyticsData.chatVolume.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData.chatVolume}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    dataKey="date"
                    stroke="#6B7280"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis stroke="#6B7280" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFF',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="conversations"
                    stroke="#6566F1"
                    strokeWidth={2}
                    dot={{ fill: '#6566F1', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                <BarChart3 className="w-12 h-12 mb-2" />
                <p>No chat volume data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Languages and Top Questions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Language Distribution */}
          <Card className="border border-gray-200 bg-white rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="w-5 h-5" />
                <span>Language Distribution</span>
              </CardTitle>
              <CardDescription>Top languages used in conversations</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-pulse text-gray-400">Loading chart...</div>
                </div>
              ) : analyticsData?.languages && analyticsData.languages.length > 0 ? (
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={analyticsData.languages}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.language} ${entry.percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {analyticsData.languages.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {analyticsData.languages.map((lang, index) => (
                      <div key={lang.code} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-sm text-gray-700">{lang.language}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">{lang.count}</span>
                          <span className="text-xs text-gray-500">({lang.percentage}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                  <Globe className="w-12 h-12 mb-2" />
                  <p>No language data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Questions */}
          <Card className="border border-gray-200 bg-white rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5" />
                <span>Top Questions</span>
              </CardTitle>
              <CardDescription>Most frequently asked questions</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  ))}
                </div>
              ) : analyticsData?.topQuestions && analyticsData.topQuestions.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {analyticsData.topQuestions.map((question, index) => (
                    <div key={index} className="border-b border-gray-100 pb-3 last:border-0">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-[#6566F1] text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900 mb-1">{question.question}</p>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-medium text-[#6566F1]">{question.count} times</span>
                            <span className="text-xs text-gray-500">({question.percentage}%)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                  <MessageSquare className="w-12 h-12 mb-2" />
                  <p>No questions data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="border border-gray-200 bg-white rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Recent Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex items-center space-x-3">
                    <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : analyticsData?.recentActivity && analyticsData.recentActivity.length > 0 ? (
              <div className="space-y-4">
                {analyticsData.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-[#6566F1]/10 rounded-full flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-[#6566F1]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{activity.bot}</p>
                        <p className="text-xs text-gray-500">{activity.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={activity.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                        {activity.status}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(activity.time).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No recent activity</p>
              </div>
            )}

            {/* Active Conversations Stats */}
            {!loading && analyticsData && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <MessageCircle className="w-5 h-5 text-green-600 mr-2" />
                      <p className="text-2xl font-bold text-green-600">{analyticsData.stats.activeConversations}</p>
                    </div>
                    <p className="text-sm text-gray-600">Active (24h)</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Clock className="w-5 h-5 text-[#6566F1] mr-2" />
                      <p className="text-2xl font-bold text-[#6566F1]">{analyticsData.stats.avgResponseTime}</p>
                    </div>
                    <p className="text-sm text-gray-600">Response Time</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
};

export default AnalyticsPage;
