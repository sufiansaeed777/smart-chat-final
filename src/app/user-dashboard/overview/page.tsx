'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  MessageSquare, 
  BarChart3, 
  Clock, 
  TrendingUp, 
  Users, 
  Loader2, 
  ArrowRight, 
  Activity, 
  Zap, 
  Shield, 
  Star,
  PlayCircle,
  Settings,
  HelpCircle,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import RoleGuard from '@/components/auth/RoleGuard';
import ProfessionalSpinner from '@/components/ui/ProfessionalSpinner';

interface UserStats {
  assignedBots: number;
  totalConversations: number;
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
  const [stats, setStats] = useState<UserStats>({
    assignedBots: 0,
    totalConversations: 0,
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

  return (
    <RoleGuard allowedRoles={['user']}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900"></div>
          <div 
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundRepeat: 'repeat'
            }}
          ></div>
          
          <div className="relative px-6 py-16 md:px-8 md:py-20">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-2xl mb-6">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                  Welcome back!
                </h1>
                <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                  Here&apos;s what&apos;s happening with your assigned bots today. 
                  Monitor performance, track conversations, and optimize your AI experience.
                </p>
              </div>

              {/* Key Metrics Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                      <Bot className="w-6 h-6 text-blue-300" />
                    </div>
                    <span className="text-2xl font-bold text-white">{stats.assignedBots}</span>
                  </div>
                  <h3 className="text-sm font-medium text-blue-100 mb-1">Assigned Bots</h3>
                  <p className="text-xs text-blue-200">Active bots in your care</p>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-green-300" />
                    </div>
                    <span className="text-2xl font-bold text-white">{stats.totalConversations}</span>
                  </div>
                  <h3 className="text-sm font-medium text-blue-100 mb-1">Total Conversations</h3>
                  <p className="text-xs text-blue-200">All time interactions</p>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                      <Activity className="w-6 h-6 text-purple-300" />
                    </div>
                    <span className="text-2xl font-bold text-white">{stats.activeConversations}</span>
                  </div>
                  <h3 className="text-sm font-medium text-blue-100 mb-1">Active Now</h3>
                  <p className="text-xs text-blue-200">Currently ongoing</p>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                      <Clock className="w-6 h-6 text-orange-300" />
                    </div>
                    <span className="text-2xl font-bold text-white">{stats.responseTime}</span>
                  </div>
                  <h3 className="text-sm font-medium text-blue-100 mb-1">Avg Response</h3>
                  <p className="text-xs text-blue-200">Response time</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-6 py-12 md:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Stats Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <Card className="group bg-white rounded-2xl shadow-lg border-0 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-gray-900">{stats.assignedBots}</div>
                      <div className="text-sm text-gray-500">Bots</div>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Assigned Bots</h3>
                  <p className="text-sm text-gray-600">AI assistants under your management</p>
                </CardContent>
              </Card>

              <Card className="group bg-white rounded-2xl shadow-lg border-0 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <MessageSquare className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-gray-900">{stats.totalConversations}</div>
                      <div className="text-sm text-gray-500">Total</div>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Conversations</h3>
                  <p className="text-sm text-gray-600">All-time user interactions</p>
                </CardContent>
              </Card>

              <Card className="group bg-white rounded-2xl shadow-lg border-0 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-gray-900">{stats.activeConversations}</div>
                      <div className="text-sm text-gray-500">Active</div>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Live Sessions</h3>
                  <p className="text-sm text-gray-600">Currently ongoing conversations</p>
                </CardContent>
              </Card>

              <Card className="group bg-white rounded-2xl shadow-lg border-0 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-gray-900">{stats.responseTime}</div>
                      <div className="text-sm text-gray-500">Avg Time</div>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Response Time</h3>
                  <p className="text-sm text-gray-600">Average bot response speed</p>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Recent Activity */}
              <div className="lg:col-span-2">
                <Card className="bg-white rounded-2xl shadow-lg border-0">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                          <Activity className="w-4 h-4 text-white" />
                        </div>
                        Recent Activity
                      </CardTitle>
                      <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                        View All
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivity.length > 0 ? (
                        recentActivity.map((activity) => (
                          <div key={activity.id} className="group flex items-center space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                              {activity.type === 'conversation' ? (
                                <MessageSquare className="w-5 h-5 text-white" />
                              ) : (
                                <Bot className="w-5 h-5 text-white" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {activity.type === 'conversation' ? 'New conversation' : 'Bot assigned'}: {activity.bot}
                              </p>
                              <p className="text-xs text-gray-500">{activity.time}</p>
                            </div>
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                              activity.status === 'active' ? 'bg-green-100 text-green-800' :
                              activity.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                              {activity.status}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">No recent activity</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions & Performance */}
              <div className="space-y-6">
                {/* Quick Actions */}
                <Card className="bg-white rounded-2xl shadow-lg border-0">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mr-3">
                        <Zap className="w-4 h-4 text-white" />
                      </div>
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Button className="w-full justify-start h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300">
                        <PlayCircle className="w-5 h-5 mr-3" />
                        Test My Bots
                        <ArrowRight className="w-4 h-4 ml-auto" />
                      </Button>
                      <Button variant="outline" className="w-full justify-start h-12 border-gray-200 hover:bg-gray-50 rounded-xl font-medium transition-all duration-300">
                        <MessageSquare className="w-5 h-5 mr-3" />
                        View Conversations
                        <ArrowRight className="w-4 h-4 ml-auto" />
                      </Button>
                      <Button variant="outline" className="w-full justify-start h-12 border-gray-200 hover:bg-gray-50 rounded-xl font-medium transition-all duration-300">
                        <BarChart3 className="w-5 h-5 mr-3" />
                        Analytics
                        <ArrowRight className="w-4 h-4 ml-auto" />
                      </Button>
                      <Button variant="outline" className="w-full justify-start h-12 border-gray-200 hover:bg-gray-50 rounded-xl font-medium transition-all duration-300">
                        <Settings className="w-5 h-5 mr-3" />
                        Settings
                        <ArrowRight className="w-4 h-4 ml-auto" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Summary */}
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg border-0">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                        <Star className="w-4 h-4 text-white" />
                      </div>
                      Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">Bot Uptime</span>
                        <span className="text-lg font-bold text-green-600">99.9%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">User Satisfaction</span>
                        <span className="text-lg font-bold text-blue-600">4.8★</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">Response Quality</span>
                        <span className="text-lg font-bold text-purple-600">Excellent</span>
                      </div>
                      <div className="pt-4 border-t border-gray-200">
                        <Button variant="ghost" className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                          <HelpCircle className="w-4 h-4 mr-2" />
                          Get Support
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
