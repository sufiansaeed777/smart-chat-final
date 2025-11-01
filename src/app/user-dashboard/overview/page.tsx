'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bot,
  MessageSquare,
  BarChart3,
  Clock,
  Activity,
  Zap,
  Star,
  PlayCircle,
  HelpCircle,
  ArrowRight,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import RoleGuard from '@/components/auth/RoleGuard';
import ProfessionalSpinner from '@/components/ui/ProfessionalSpinner';
import { useChatBot } from '@/contexts/ChatBotContext';

interface UserStats {
  assignedBots: number;
  totalConversations: number;
  totalUsersWhoMessaged: number;
  activeConversations: number;
  responseTime: string;
}

interface RecentActivity {
  id: string;
  type: string;
  bot: string;
  time: string;
  status: string;
}

export default function UserOverviewPage() {
  const router = useRouter();
  const { triggerChat } = useChatBot();
  const [stats, setStats] = useState<UserStats>({
    assignedBots: 0,
    totalConversations: 0,
    totalUsersWhoMessaged: 0,
    activeConversations: 0,
    responseTime: '0 min'
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);

        // Fetch user analytics
        const analyticsResponse = await fetch('/api/user/analytics');
        const analyticsData = await analyticsResponse.json();

        if (analyticsData.stats) {
          setStats({
            assignedBots: analyticsData.stats.assignedBots,
            totalConversations: analyticsData.stats.totalConversations,
            totalUsersWhoMessaged: analyticsData.stats.totalUsersWhoMessaged || 0,
            activeConversations: analyticsData.stats.activeConversations,
            responseTime: analyticsData.stats.avgResponseTime
          });
        }

        if (analyticsData.recentActivity) {
          // Format recent activity with relative time
          const formattedActivity = analyticsData.recentActivity.map((activity: { id: string; type: string; description: string; time: string }) => ({
            ...activity,
            time: formatRelativeTime(activity.time)
          }));
          setRecentActivity(formattedActivity);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hour ago`;
    return `${Math.floor(diffInMinutes / 1440)} day ago`;
  };

  if (loading) {
    return (
      <RoleGuard allowedRoles={['user']}>
        <ProfessionalSpinner text="Loading your dashboard..." />
      </RoleGuard>
    );
  }

  const metrics = [
    {
      title: "Users Who Messaged",
      value: stats.totalUsersWhoMessaged.toString(),
      change: "Unique visitors",
      icon: User,
      bgColor: "bg-purple-50",
      iconBg: "bg-purple-500",
      textColor: "text-purple-600"
    },
    {
      title: "Total Conversations",
      value: stats.totalConversations.toString(),
      change: "All time interactions",
      icon: MessageSquare,
      bgColor: "bg-green-50",
      iconBg: "bg-green-500",
      textColor: "text-green-600"
    },
    {
      title: "Active Chats",
      value: stats.activeConversations.toString(),
      change: "Last 24 hours",
      icon: Activity,
      bgColor: "bg-blue-50",
      iconBg: "bg-blue-500",
      textColor: "text-blue-600"
    },
    {
      title: "Assigned Bots",
      value: stats.assignedBots.toString(),
      change: "Your bots",
      icon: Bot,
      bgColor: "bg-gray-50",
      iconBg: "bg-gray-500",
      textColor: "text-gray-600"
    }
  ];

  return (
    <RoleGuard allowedRoles={['user']}>
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        {/* Top Row - Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric, index) => (
            <Card
              key={index}
              className={`${metric.bgColor} border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer group`}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 ${metric.iconBg} rounded-lg flex items-center justify-center shadow-sm flex-shrink-0 group-hover:scale-110 transition-all duration-300`}>
                    <metric.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-900 truncate">{metric.title}</p>
                    <p className={`text-xl font-bold ${metric.textColor}`}>{metric.value}</p>
                    <p className="text-xs text-gray-600">{metric.change}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card className="bg-white rounded-2xl shadow-sm border-0 hover:shadow-lg transition-all duration-300">
            <CardHeader className="p-6 pb-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-6 h-6 text-gray-600" />
                <CardTitle className="text-xl font-bold text-gray-900">Recent Activity</CardTitle>
              </div>
              <p className="text-sm text-gray-600">Latest activities and bot assignments</p>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-300 cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                          {activity.type === 'conversation' ? (
                            <MessageSquare className="w-4 h-4 text-gray-600" />
                          ) : (
                            <Bot className="w-4 h-4 text-gray-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {activity.type === 'conversation' ? 'New conversation' : 'Bot assigned'}: {activity.bot}
                          </p>
                          <p className="text-sm text-gray-600">{activity.time}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        activity.status === 'active' ? 'bg-green-100 text-green-600' :
                        activity.status === 'completed' ? 'bg-blue-100 text-blue-600' :
                        'bg-purple-100 text-purple-600'
                      }`}>
                        {activity.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No recent activity</p>
                    <p className="text-sm text-gray-400 mt-2">Your activity will appear here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-white rounded-2xl shadow-sm border-0 hover:shadow-lg transition-all duration-300">
            <CardHeader className="p-6 pb-4">
              <div className="flex items-center space-x-2">
                <Zap className="w-6 h-6 text-gray-600" />
                <CardTitle className="text-xl font-bold text-gray-900">Quick Actions</CardTitle>
              </div>
              <p className="text-sm text-gray-600">Frequently used features</p>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="space-y-3">
                <Button
                  onClick={() => router.push('/user-dashboard/playground')}
                  className="w-full justify-start h-12 bg-[#5A5BD8] hover:bg-[#5A5BD8]/90 text-white rounded-lg font-medium transition-all duration-300"
                >
                  <PlayCircle className="w-5 h-5 mr-3" />
                  Test My Bots
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </Button>
                <Button
                  onClick={() => router.push('/user-dashboard/conversations')}
                  variant="outline"
                  className="w-full justify-start h-12 border-gray-200 hover:bg-gray-50 rounded-lg font-medium transition-all duration-300"
                >
                  <MessageSquare className="w-5 h-5 mr-3" />
                  View Conversations
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </Button>
                <Button
                  onClick={() => router.push('/user-dashboard/analytics')}
                  variant="outline"
                  className="w-full justify-start h-12 border-gray-200 hover:bg-gray-50 rounded-lg font-medium transition-all duration-300"
                >
                  <BarChart3 className="w-5 h-5 mr-3" />
                  Analytics
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </Button>
                <Button
                  onClick={() => router.push('/user-dashboard/bots')}
                  variant="outline"
                  className="w-full justify-start h-12 border-gray-200 hover:bg-gray-50 rounded-lg font-medium transition-all duration-300"
                >
                  <Bot className="w-5 h-5 mr-3" />
                  My Bots
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </Button>
                <Button
                  onClick={triggerChat}
                  variant="outline"
                  className="w-full justify-start h-12 border-gray-200 hover:bg-gray-50 rounded-lg font-medium transition-all duration-300"
                >
                  <HelpCircle className="w-5 h-5 mr-3" />
                  Get Support
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <Card className="bg-white rounded-2xl shadow-sm border-0 hover:shadow-lg transition-all duration-300">
          <CardHeader className="p-6 pb-4">
            <div className="flex items-center space-x-2">
              <Star className="w-6 h-6 text-gray-600" />
              <CardTitle className="text-xl font-bold text-gray-900">Performance Metrics</CardTitle>
            </div>
            <p className="text-sm text-gray-600">Bot performance and system health</p>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Bot Uptime */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-700">Bot Uptime</span>
                    <p className="text-xs text-gray-500">System availability</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-green-600">99.9%</span>
                  <p className="text-xs text-green-500 font-medium">+0.1%</p>
                </div>
              </div>

              {/* User Satisfaction */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Star className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-700">User Satisfaction</span>
                    <p className="text-xs text-gray-500">Customer rating</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-1">
                    <span className="text-2xl font-bold text-blue-600">4.8</span>
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  </div>
                  <p className="text-xs text-blue-500 font-medium">+0.2</p>
                </div>
              </div>

              {/* Response Quality */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Zap className="w-4 h-4 text-purple-500" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-700">Response Quality</span>
                    <p className="text-xs text-gray-500">AI accuracy</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-purple-600">Excellent</span>
                  <p className="text-xs text-purple-500 font-medium">98%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}
