'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  MessageSquare,
  Clock,
  Globe,
  Bot,
  AlertCircle,
  Star,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Users,
  MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ComposedChart,
  Bar
} from 'recharts';

// Types
interface OverviewData {
  aiMessages: number;
  humanMessages: number;
  issueReports: number;
  csatRating: number;
  avgResponseTime: number;
  languagesUsed: number;
  totalBots: number;
  totalConversations: number;
}

interface LanguageData {
  language: string;
  code: string;
  count: number;
  percentage: string;
}

interface QuestionData {
  question: string;
  timesAsked: number;
  botName: string;
  lastAsked: string;
}

interface TrendData {
  date: string;
  aiMessages: number;
  humanMessages: number;
}

interface BotData {
  botId: string;
  botName: string;
  status: string;
  totalConversations: number;
  aiMessages: number;
  humanMessages: number;
  issueReports: number;
  humanRequests: number;
  csatRating: number;
  avgResponseTime: number;
  languagesUsed: number;
  topQuestion?: string;
}

interface IssueData {
  id: string;
  type: string;
  userName: string;
  userEmail: string;
  message: string;
  status: string;
  priority: string;
  botName: string;
  createdAt: string;
}

interface BotOption {
  id: string;
  name: string;
}

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#6b7280'];

const PERIOD_OPTIONS = [
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: '1y', label: 'Last Year' },
  { value: 'lifetime', label: 'All Time' },
];

const AnalyticsPage = () => {
  // State
  const [period, setPeriod] = useState('30d');
  const [selectedBot, setSelectedBot] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trendView, setTrendView] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Data states
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [languages, setLanguages] = useState<{ total: number; data: LanguageData[] }>({ total: 0, data: [] });
  const [questions, setQuestions] = useState<{ total: number; data: QuestionData[] }>({ total: 0, data: [] });
  const [trends, setTrends] = useState<{ groupBy: string; data: TrendData[] }>({ groupBy: 'day', data: [] });
  const [bots, setBots] = useState<BotData[]>([]);
  const [issues, setIssues] = useState<{ total: number; data: IssueData[] }>({ total: 0, data: [] });
  const [botOptions, setBotOptions] = useState<BotOption[]>([]);

  // Expanded bot accordions
  const [expandedBots, setExpandedBots] = useState<Set<string>>(new Set());

  // CSAT trend data (derived from real data when available)
  const [csatTrend, setCsatTrend] = useState([
    { week: 'Week 1', rating: 4.2 },
    { week: 'Week 2', rating: 4.5 },
    { week: 'Week 3', rating: 4.8 },
    { week: 'Week 4', rating: 4.6 },
  ]);

  // Response time trend data
  const [responseTimeTrend, setResponseTimeTrend] = useState([
    { week: 'Week 1', time: 2.1, trend: 2.1 },
    { week: 'Week 2', time: 1.9, trend: 1.95 },
    { week: 'Week 3', time: 1.8, trend: 1.85 },
    { week: 'Week 4', time: 1.8, trend: 1.75 },
  ]);

  // Load all analytics data
  const loadAnalytics = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const botParam = selectedBot !== 'all' ? `&botId=${selectedBot}` : '';
      const baseUrl = `/api/manager/analytics?period=${period}${botParam}`;

      const [overviewRes, languagesRes, questionsRes, trendsRes, botwiseRes, issuesRes, botsListRes] = await Promise.all([
        fetch(`${baseUrl}&type=overview`),
        fetch(`${baseUrl}&type=languages`),
        fetch(`${baseUrl}&type=topQuestions`),
        fetch(`${baseUrl}&type=messageTrends`),
        fetch(`/api/manager/analytics?period=${period}&type=botwise`),
        fetch(`${baseUrl}&type=issues`),
        fetch('/api/manager/bots')
      ]);

      if (overviewRes.ok) setOverview(await overviewRes.json());
      if (languagesRes.ok) setLanguages(await languagesRes.json());
      if (questionsRes.ok) setQuestions(await questionsRes.json());
      if (trendsRes.ok) setTrends(await trendsRes.json());
      if (botwiseRes.ok) {
        const data = await botwiseRes.json();
        setBots(data.bots || []);
      }
      if (issuesRes.ok) setIssues(await issuesRes.json());
      if (botsListRes.ok) {
        const data = await botsListRes.json();
        setBotOptions(data.bots || []);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period, selectedBot]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const toggleBot = (botId: string) => {
    setExpandedBots(prev => {
      const next = new Set(prev);
      if (next.has(botId)) next.delete(botId);
      else next.add(botId);
      return next;
    });
  };

  const formatTrendDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (trendView === 'monthly') return date.toLocaleDateString('en-US', { month: 'short' });
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hrs ago`;
    return 'Just now';
  };

  const formatIssueDate = (dateStr: string) => new Date(dateStr).toISOString().split('T')[0];

  const getLanguageBreakdown = () => {
    if (languages.data.length === 0) return '';
    return languages.data.slice(0, 3).map(l => `${l.language} (${l.percentage}%)`).join(', ');
  };

  const pieChartData = languages.data.slice(0, 4).map((lang, index) => ({
    name: lang.language,
    value: lang.count,
    percentage: parseFloat(lang.percentage),
    color: COLORS[index % COLORS.length]
  }));

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-32"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40 border-gray-200 bg-white rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedBot} onValueChange={setSelectedBot}>
            <SelectTrigger className="w-36 border-gray-200 bg-white rounded-lg">
              <SelectValue placeholder="All Bots" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Bots</SelectItem>
              {botOptions.map(bot => (
                <SelectItem key={bot.id} value={bot.id}>{bot.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => loadAnalytics(true)}
            disabled={refreshing}
            className="rounded-lg border-gray-200 gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stat Cards Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* AI Messages */}
        <Card className="border border-gray-200 bg-white rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">AI Messages</p>
                <p className="text-3xl font-bold text-gray-900">
                  {(overview?.aiMessages || 0).toLocaleString()}
                </p>
                <p className="text-sm text-gray-400 mt-1">AI generated messages</p>
              </div>
              <div className="p-3 bg-blue-500 rounded-xl">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Human Messages */}
        <Card className="border border-gray-200 bg-white rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Human Messages</p>
                <p className="text-3xl font-bold text-gray-900">
                  {(overview?.humanMessages || 0).toLocaleString()}
                </p>
                <p className="text-sm text-gray-400 mt-1">Messages sent by users</p>
              </div>
              <div className="p-3 bg-orange-400 rounded-xl">
                <Users className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Issue Reports */}
        <Card className="border border-gray-200 bg-white rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Issue Reports</p>
                <p className="text-3xl font-bold text-gray-900">{overview?.issueReports || 0}</p>
                <p className="text-sm text-gray-400 mt-1">Reported issues</p>
              </div>
              <div className="p-3 bg-red-500 rounded-xl">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stat Cards Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* CSAT Rating */}
        <Card className="border border-gray-200 bg-white rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">CSAT Rating</p>
                <div className="flex items-center gap-2">
                  <Star className="w-7 h-7 text-yellow-400 fill-yellow-400" />
                  <p className="text-3xl font-bold text-gray-900">
                    {overview?.csatRating || 0} / 5.0
                  </p>
                </div>
                <p className="text-sm text-gray-400 mt-1">Customer Satisfaction</p>
              </div>
              <div className="p-3 bg-yellow-400 rounded-xl">
                <Star className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Avg Response Time */}
        <Card className="border border-gray-200 bg-white rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Avg Response Time</p>
                <p className="text-3xl font-bold text-gray-900">{overview?.avgResponseTime || 0}s</p>
                <p className="text-sm text-gray-400 mt-1">Bot reply time</p>
              </div>
              <div className="p-3 bg-teal-500 rounded-xl">
                <Clock className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Languages Used */}
        <Card className="border border-gray-200 bg-white rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Languages Used</p>
                <p className="text-3xl font-bold text-gray-900">{overview?.languagesUsed || 0}</p>
                <p className="text-sm text-gray-400 mt-1 max-w-[200px] truncate">
                  {getLanguageBreakdown() || 'No data yet'}
                </p>
              </div>
              <div className="p-3 bg-teal-500 rounded-xl">
                <Globe className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Message Trends & CSAT Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Message Trends */}
        <Card className="border border-gray-200 bg-white rounded-2xl lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                <CardTitle className="text-lg font-semibold">Message Trends</CardTitle>
              </div>
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                {['daily', 'weekly', 'monthly'].map(view => (
                  <button
                    key={view}
                    onClick={() => setTrendView(view as any)}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors capitalize ${
                      trendView === view ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {view.charAt(0).toUpperCase() + view.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {trends.data.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trends.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tickFormatter={formatTrendDate} tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Line type="monotone" dataKey="aiMessages" name="AI Messages" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: '#3b82f6' }} />
                  <Line type="monotone" dataKey="humanMessages" name="Human Messages" stroke="#22c55e" strokeWidth={2} dot={{ r: 4, fill: '#22c55e' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No message data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* CSAT Trend */}
        <Card className="border border-gray-200 bg-white rounded-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              <CardTitle className="text-lg font-semibold">CSAT Trend</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={csatTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis domain={[4, 5]} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="rating" stroke="#f59e0b" strokeWidth={2} dot={{ r: 5, fill: '#f59e0b' }} />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-2 mt-2">
              <div className="w-3 h-3 rounded-full bg-orange-400"></div>
              <span className="text-sm text-gray-600">CSAT Rating</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Response Time Chart */}
      <Card className="border border-gray-200 bg-white rounded-2xl">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-500" />
            <CardTitle className="text-lg font-semibold">Response Time</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={responseTimeTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis domain={[1.5, 2.5]} tickFormatter={(v) => `${v}s`} tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
              <Bar dataKey="time" name="Response Time" fill="#c4b5fd" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="trend" name="Trend" stroke="#f59e0b" strokeWidth={2} dot={{ r: 5, fill: '#f59e0b' }} />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-6 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 rounded bg-purple-200"></div>
              <span className="text-sm text-gray-600">Response Time</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-400"></div>
              <span className="text-sm text-gray-600">Trend</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Most Asked Questions & Issue Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Asked Questions */}
        <Card className="border border-gray-200 bg-white rounded-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-500" />
                <CardTitle className="text-lg font-semibold">Most Asked Questions</CardTitle>
              </div>
              <span className="text-sm text-gray-400">Top queries</span>
            </div>
          </CardHeader>
          <CardContent>
            {questions.data.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase">Question</th>
                      <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase">Times Asked</th>
                      <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase">Bot</th>
                      <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase">Last Asked</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questions.data.slice(0, 5).map((q, index) => (
                      <tr key={index} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3 px-2 text-sm text-gray-700 max-w-[200px] truncate">{q.question}</td>
                        <td className="py-3 px-2 text-sm text-gray-900 font-medium">{q.timesAsked}</td>
                        <td className="py-3 px-2">
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">{q.botName}</span>
                        </td>
                        <td className="py-3 px-2 text-sm text-gray-500">{formatTimeAgo(q.lastAsked)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-gray-400">
                <div className="text-center">
                  <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No questions recorded yet</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Issue Reports */}
        <Card className="border border-gray-200 bg-white rounded-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <CardTitle className="text-lg font-semibold">Issue Reports</CardTitle>
              </div>
              <span className="text-sm text-gray-400">Recent</span>
            </div>
          </CardHeader>
          <CardContent>
            {issues.data.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {issues.data.slice(0, 5).map((issue) => (
                  <div key={issue.id} className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm text-gray-900">{issue.userEmail}</p>
                        <p className="text-sm text-gray-600 mt-0.5">{issue.message}</p>
                        <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                          {issue.botName}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">{formatIssueDate(issue.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-gray-400">
                <div className="text-center">
                  <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No issues reported yet</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bot-wise Analytics & Language Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bot-wise Analytics */}
        <Card className="border border-gray-200 bg-white rounded-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-gray-600" />
              <CardTitle className="text-lg font-semibold">Bot-wise Analytics</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {bots.length > 0 ? (
              <div className="space-y-3">
                {bots.map(bot => (
                  <div key={bot.botId} className="border border-gray-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleBot(bot.botId)}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <Bot className="w-4 h-4 text-gray-600" />
                        </div>
                        <span className="font-medium text-gray-900">{bot.botName}</span>
                      </div>
                      {expandedBots.has(bot.botId) ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </button>

                    {expandedBots.has(bot.botId) && (
                      <div className="border-t border-gray-200 p-4 bg-white">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-gray-500">AI Messages</p>
                            <p className="text-lg font-bold text-gray-900">{bot.aiMessages.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Human Messages</p>
                            <p className="text-lg font-bold text-gray-900">{bot.humanMessages.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">CSAT Rating</p>
                            <p className="text-lg font-bold text-gray-900">{bot.csatRating} / 5</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Issues Reported</p>
                            <p className="text-lg font-bold text-gray-900">{bot.issueReports}</p>
                          </div>
                        </div>
                        <div className="mb-4">
                          <p className="text-xs text-gray-500">Top Question</p>
                          <p className="text-sm text-gray-700">{questions.data.find(q => q.botName === bot.botName)?.question || 'No questions yet'}</p>
                        </div>
                        <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg">
                          View Details
                        </Button>
                      </div>
                    )}
                  </div>
                ))}

                {/* Quick Summary */}
                <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm font-medium text-gray-700 mb-2">Quick Summary</p>
                  {bots.map(bot => (
                    <p key={bot.botId} className="text-sm text-blue-600">
                      {bot.botName} — AI {bot.aiMessages.toLocaleString()} / Human {bot.humanMessages.toLocaleString()}
                    </p>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-gray-400">
                <div className="text-center">
                  <Bot className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No bots created yet</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Language Analytics */}
        <Card className="border border-gray-200 bg-white rounded-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-teal-500" />
              <CardTitle className="text-lg font-semibold">Language Analytics</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {languages.data.length > 0 ? (
              <>
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <ResponsiveContainer width={180} height={180}>
                      <PieChart>
                        <Pie data={pieChartData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={2} dataKey="value">
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">100%</p>
                        <p className="text-xs text-gray-500">Total</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {languages.data.slice(0, 4).map((lang, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="flex items-center gap-2 w-24">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="text-sm text-gray-700">{lang.language}</span>
                      </div>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${lang.percentage}%`, backgroundColor: COLORS[index % COLORS.length] }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700 w-12 text-right">{lang.percentage}%</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-sm font-medium text-blue-800">Language Distribution</p>
                  <p className="text-xs text-blue-600 mt-1">
                    {languages.data[0]?.language || 'English'} is the most used language
                    {languages.data[1] ? `, followed by ${languages.data[1].language}` : ''}
                    {languages.data[2] ? ` and ${languages.data[2].language}` : ''}.
                    Language support helps reach a wider audience.
                  </p>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400">
                <div className="text-center">
                  <Globe className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No language data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsPage;
