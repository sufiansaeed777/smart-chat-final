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
  Bot
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

interface AnalyticsData {
  stats: {
    assignedBots: number;
    totalConversations: number;
    recentConversations: number;
    activeConversations: number;
    avgResponseTime: string;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    bot: string;
    time: string;
    status: string;
  }>;
}

const AnalyticsPage = () => {
  const [timeRange, setTimeRange] = useState("7d");
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/user/analytics');
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
