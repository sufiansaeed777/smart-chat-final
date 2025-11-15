'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Users,
  MessageSquare,
  Clock,
  Download,
  Globe,
  MessageCircle,
  CheckCircle,
  UserCheck
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
  ResponsiveContainer
} from 'recharts';

interface LanguageData {
  language: string;
  code: string;
  count: number;
  percentage: string;
}

interface QuestionData {
  question: string;
  count: number;
  percentage: string;
}

const COLORS = ['#6566F1', '#8b5cf6', '#0891b2', '#f59e0b', '#fbbf24', '#ef4444', '#10b981', '#ec4899'];

const AnalyticsPage = () => {
  const [timeRange, setTimeRange] = useState("7d");
  const [loading, setLoading] = useState(true);
  const [languagesData, setLanguagesData] = useState<{ total: number; data: LanguageData[] }>({ total: 0, data: [] });
  const [questionsData, setQuestionsData] = useState<{ total: number; data: QuestionData[] }>({ total: 0, data: [] });
  const [humanMessages, setHumanMessages] = useState(0);
  const [totalAgents, setTotalAgents] = useState(0);
  const [resolvedIssues, setResolvedIssues] = useState(0);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Load languages data
      const languagesResponse = await fetch('/api/manager/analytics?type=languages');
      if (languagesResponse.ok) {
        const languagesResult = await languagesResponse.json();
        setLanguagesData(languagesResult);
      }

      // Load top questions data
      const questionsResponse = await fetch('/api/manager/analytics?type=topQuestions');
      if (questionsResponse.ok) {
        const questionsResult = await questionsResponse.json();
        setQuestionsData(questionsResult);
      }

      // Load human messages count
      const humanMessagesResponse = await fetch('/api/manager/analytics?type=humanMessages');
      if (humanMessagesResponse.ok) {
        const humanMessagesResult = await humanMessagesResponse.json();
        setHumanMessages(humanMessagesResult.total);
      }

      // Load total agents count
      const totalAgentsResponse = await fetch('/api/manager/analytics?type=totalAgents');
      if (totalAgentsResponse.ok) {
        const totalAgentsResult = await totalAgentsResponse.json();
        setTotalAgents(totalAgentsResult.total);
      }

      // Load resolved issues count
      const resolvedIssuesResponse = await fetch('/api/manager/analytics?type=resolvedIssues');
      if (resolvedIssuesResponse.ok) {
        const resolvedIssuesResult = await resolvedIssuesResponse.json();
        setResolvedIssues(resolvedIssuesResult.total);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Prepare pie chart data
  const pieChartData = languagesData.data.map((lang, index) => ({
    name: lang.language,
    value: lang.count,
    percentage: lang.percentage,
    color: COLORS[index % COLORS.length]
  }));

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-600 mt-1">Track your bot&apos;s performance and insights</p>
        </div>

        {/* Controls */}
        <div className="flex justify-end gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32 border-gray-300 focus:border-[#6566F1] focus:ring-[#6566F1] bg-white rounded-2xl">
              <SelectValue className="text-gray-700" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h" className="text-gray-700">Last 24h</SelectItem>
              <SelectItem value="7d" className="text-gray-700">Last 7 days</SelectItem>
              <SelectItem value="30d" className="text-gray-700">Last 30 days</SelectItem>
              <SelectItem value="90d" className="text-gray-700">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-[#6566F1] hover:bg-[#5A5BD8] text-white rounded-2xl">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>

        {/* Key Metrics */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="border border-gray-200 bg-white rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5 text-[#6566F1]" />
                  <div>
                    <p className="text-2xl font-bold">{languagesData.total}</p>
                    <p className="text-sm text-gray-600">Total Conversations</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 bg-white rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <MessageCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">{humanMessages}</p>
                    <p className="text-sm text-gray-600">Human Messages</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 bg-white rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <UserCheck className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="text-2xl font-bold">{totalAgents}</p>
                    <p className="text-sm text-gray-600">Total Agents</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 bg-white rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <div>
                    <p className="text-2xl font-bold">{resolvedIssues}</p>
                    <p className="text-sm text-gray-600">Resolved Issues</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 bg-white rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Globe className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{languagesData.data.length}</p>
                    <p className="text-sm text-gray-600">Languages Used</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 bg-white rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <MessageCircle className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="text-2xl font-bold">{questionsData.total}</p>
                    <p className="text-sm text-gray-600">Total Questions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Language Distribution */}
        <Card className="border border-gray-200 bg-white rounded-2xl">
          <CardHeader>
            <CardTitle>Language Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6566F1]"></div>
              </div>
            ) : pieChartData.length > 0 ? (
              <div className="flex items-center justify-between">
                <ResponsiveContainer width="60%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  {pieChartData.map((item, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm font-medium text-gray-900">{item.name}</span>
                      <span className="text-sm text-gray-600">{item.percentage}% ({item.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Globe className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No language data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Questions */}
        <Card className="border border-gray-200 bg-white rounded-2xl">
          <CardHeader>
            <CardTitle>Most Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse flex items-center space-x-3">
                    <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 w-12 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : questionsData.data.length > 0 ? (
              <div className="space-y-4">
                {questionsData.data.map((item, index) => (
                  <div key={index} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="w-6 h-6 bg-[#6566F1] text-white rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
                        {index + 1}
                      </div>
                      <span className="text-sm text-gray-700">{item.question}</span>
                    </div>
                    <div className="text-right ml-4">
                      <span className="text-sm font-medium text-gray-900">{item.count}</span>
                      <p className="text-xs text-gray-500">{item.percentage}%</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No questions data available</p>
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
};

export default AnalyticsPage;
