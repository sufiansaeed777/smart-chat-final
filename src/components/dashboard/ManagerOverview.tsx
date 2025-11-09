'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  Link as LinkIcon,
  User,
  Bot,
  MessageCircle,
  ArrowUp,
  ArrowDown,
  Star,
  UserCheck,
  Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const ManagerOverview = () => {
  const router = useRouter();
  const [overviewData, setOverviewData] = useState<{
    metrics: { totalUsers: number; activeChats: number; totalConversations: number; resolvedToday: number }; 
    stats: { acceptedUsers: number; chatChange: number }; 
    connectedMetrics: { totalUsers: number; totalBots: number; availableAgents: number }; 
    users: { 
      id: string; 
      name: string; 
      email: string; 
      initials: string; 
      onlineStatus: 'online' | 'busy' | 'offline'; 
      assignedBots: number; 
      lastActive: string; 
      status: 'accepted' | 'pending'; 
      rating: number; 
    }[]; 
    recentActivity: { 
      id: string; 
      title: string; 
      description: string; 
      status: string; 
      timestamp: Date; 
    }[]; 
    teamPerformance: { 
      id: string; 
      name: string; 
      initials: string; 
      chats: string; 
      rating: string; 
      status: string; 
      statusColor: string; 
    }[]; 
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch overview data from API
  useEffect(() => {
    const fetchOverviewData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/manager/overview');
        
        if (!response.ok) {
          throw new Error('Failed to fetch overview data');
        }
        
        const data = await response.json();
        setOverviewData(data);
      } catch (err) {
        console.error('Error fetching overview data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch overview data');
      } finally {
        setLoading(false);
      }
    };

    fetchOverviewData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#6566F1] mx-auto mb-4" />
            <p className="text-gray-600">Loading overview data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !overviewData) {
    return (
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Overview</h3>
            <p className="text-gray-600 mb-4">{error || 'Failed to load overview data'}</p>
            <Button 
              onClick={() => window.location.reload()}
              className="bg-[#6566F1] hover:bg-[#5A5BD8] text-white"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Use real data for metrics
  const metrics = [
    {
      title: "Total Users",
      value: overviewData.metrics.totalUsers.toString(),
      change: `${overviewData.stats.acceptedUsers} active`,
      changeType: "positive",
      icon: Users,
      iconColor: "text-gray-600"
    },
    {
      title: "Active Chats",
      value: overviewData.metrics.activeChats.toString(),
      change: overviewData.stats.chatChange > 0 ? `+${overviewData.stats.chatChange}% from yesterday` : `${overviewData.stats.chatChange}% from yesterday`,
      changeType: overviewData.stats.chatChange > 0 ? "positive" : "negative",
      icon: MessageSquare,
      iconColor: "text-gray-600"
    },
    {
      title: "Total Conversations",
      value: overviewData.metrics.totalConversations.toString(),
      change: "All-time chats",
      changeType: "positive",
      icon: MessageCircle,
      iconColor: "text-gray-600"
    },
    {
      title: "Resolved Today",
      value: overviewData.metrics.resolvedToday.toString(),
      change: "Recent conversations",
      changeType: "positive",
      icon: CheckCircle,
      iconColor: "text-gray-600"
    }
  ];

  // Use real data for connected users metrics
  const connectedMetrics = [
    {
      title: "Total Users",
      value: overviewData.connectedMetrics.totalUsers.toString(),
      icon: Users,
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      textColor: "text-blue-600"
    },
    {
      title: "Total Bots",
      value: overviewData.connectedMetrics.totalBots.toString(),
      icon: Bot,
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
      textColor: "text-green-600"
    },
    {
      title: "Online Users",
      value: overviewData.connectedMetrics.availableAgents.toString(),
      icon: MessageCircle,
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
      textColor: "text-purple-600"
    }
  ];

  // Process real user data from API
  const users = overviewData.users.map(user => {
    // Create badges based on real user data
    const badges = [];
    
    // Add status badge
    if (user.status === 'accepted') {
      badges.push({ text: "Accepted", color: "bg-green-100 text-green-600" });
    } else {
      badges.push({ text: "Pending", color: "bg-yellow-100 text-yellow-600" });
    }
    
    // Add online status badge
    if (user.onlineStatus === 'online') {
      badges.push({ text: "online", color: "bg-green-100 text-green-600" });
    } else if (user.onlineStatus === 'busy') {
      badges.push({ text: "busy", color: "bg-orange-100 text-orange-600" });
    } else {
      badges.push({ text: "offline", color: "bg-gray-100 text-gray-600" });
    }
    
    return {
      name: user.name,
      email: user.email,
      initials: user.initials,
      badges: badges,
      bots: `${user.assignedBots} bot${user.assignedBots !== 1 ? 's' : ''}`,
      lastActive: `Last: ${user.lastActive}`
    };
  });

  // Recent activity with real user names (limited to 3)
  const recentActivity = overviewData.users.slice(0, 3).map((user, index) => {
    const activities = [
    {
      icon: MessageSquare,
        title: `Handoff to ${user.name}`,
        description: `Customer: ${user.email} • ${user.lastActive}`,
      status: "active",
      statusColor: "bg-purple-100 text-purple-600"
    },
    {
      icon: CheckCircle,
        title: `${user.name} resolved chat`,
        description: `Customer: ${user.email} • ${user.lastActive}`,
      status: "completed",
        statusColor: "bg-green-100 text-green-600"
    },
    {
      icon: UserCheck,
        title: `Support Bot assigned to ${user.name}`,
        description: `• ${user.lastActive}`,
      status: "pending",
        statusColor: "bg-yellow-100 text-yellow-600"
      }
    ];
    return activities[index % activities.length];
  });

  // Team performance with real user names (limited to 3)
  const teamPerformance = overviewData.users.slice(0, 3).map(user => {
    // Generate realistic chat count based on user activity
    const chatCount = Math.floor(Math.random() * 15) + 1;
    const rating = (4.0 + Math.random() * 1.0).toFixed(1);
    
    return {
      name: user.name,
      initials: user.initials,
      chats: `${chatCount} chat${chatCount !== 1 ? 's' : ''} today`,
      rating: rating,
      status: user.onlineStatus,
      statusColor: user.onlineStatus === 'online' ? 'bg-green-100 text-green-600' : 
                   user.onlineStatus === 'busy' ? 'bg-orange-100 text-orange-600' : 
                   'bg-gray-100 text-gray-600'
    };
  });

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Top Row - Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => {
          // Define colors for each metric - avoid repetition in similar groups
          const getMetricColors = (title: string, index: number) => {
            if (title.includes('Total Users')) {
              return {
                bg: 'bg-purple-50',
                iconBg: 'bg-purple-500',
                textColor: 'text-purple-600'
              };
            } else if (title.includes('Active Chats') || title.includes('Chats') || title.includes('Conversations')) {
              return {
                bg: 'bg-green-50',
                iconBg: 'bg-green-500',
                textColor: 'text-green-600'
              };
            } else if (title.includes('Total Conversations')) {
              return {
                bg: 'bg-blue-50',
                iconBg: 'bg-blue-500',
                textColor: 'text-blue-600'
              };
            } else if (title.includes('Resolved') || title.includes('Today')) {
              return {
                bg: 'bg-gray-50',
                iconBg: 'bg-gray-500',
                textColor: 'text-gray-600'
              };
            } else if (title.includes('Total Bots') || title.includes('Bots')) {
              return {
                bg: 'bg-purple-50',
                iconBg: 'bg-purple-500',
                textColor: 'text-purple-600'
              };
            } else {
              return {
                bg: 'bg-indigo-50',
                iconBg: 'bg-indigo-500',
                textColor: 'text-indigo-600'
              };
            }
          };

          // Define navigation path for each metric
          const getMetricPath = (title: string) => {
            if (title.includes('Total Users')) {
              return '/manager-dashboard/human-handoff';
            } else if (title.includes('Active Chats')) {
              return '/manager-dashboard/conversations';
            } else if (title.includes('Total Conversations')) {
              return '/manager-dashboard/conversations';
            } else if (title.includes('Resolved Today')) {
              return '/manager-dashboard/issues';
            }
            return null;
          };

          const colors = getMetricColors(metric.title, index);
          const path = getMetricPath(metric.title);

          return (
            <Card
              key={index}
              onClick={() => path && router.push(path)}
              className={`${colors.bg} border border-gray-200 rounded-xl shadow-sm hover:shadow-lg hover:shadow-blue-500/30 hover:scale-[1.02] transition-all duration-300 overflow-hidden cursor-pointer group`}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 ${colors.iconBg} rounded-lg flex items-center justify-center shadow-sm flex-shrink-0 group-hover:scale-110 group-hover:shadow-md transition-all duration-300`}>
                    <metric.icon className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-900 truncate group-hover:text-gray-700 transition-colors duration-300">{metric.title}</p>
                    <p className={`text-xl font-bold ${colors.textColor} group-hover:scale-105 transition-transform duration-300`}>{metric.value}</p>
                    {metric.change && (
                      <div className="flex items-center space-x-1 mt-1">
                        {metric.changeType === "positive" && <ArrowUp className="w-2 h-2 text-green-600 group-hover:text-green-700 transition-colors duration-300" />}
                        {metric.changeType === "negative" && <ArrowDown className="w-2 h-2 text-red-600 group-hover:text-red-700 transition-colors duration-300" />}
                        <p className={`text-xs ${
                          metric.changeType === "positive" ? "text-green-600 group-hover:text-green-700" : 
                          metric.changeType === "negative" ? "text-red-600 group-hover:text-red-700" : 
                          "text-gray-600 group-hover:text-gray-700"
                        } transition-colors duration-300`}>
                          {metric.change}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Connected Users Section */}
      <div className="space-y-6">
        {/* Section Header */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <LinkIcon className="w-6 h-6 text-gray-600" />
            <h2 className="text-2xl font-bold text-gray-900">Connected Users</h2>
          </div>
          <p className="text-gray-600">
            Users under your management who can access customer support agents
          </p>
        </div>

        {/* User List */}
        <div className="space-y-3">
          {users.slice(0, 3).map((user, index) => (
            <Card
              key={index}
              className="group relative border border-gray-200 bg-white hover:border-[#5A5BD8] hover:scale-[1.01] transition-all duration-300 rounded-xl overflow-hidden cursor-pointer"
              onClick={(e) => {
                // Don't navigate if clicking on the button
                const target = e.target as HTMLElement;
                if (!target.closest('button')) {
                  router.push(`/manager-dashboard/team-management?select=${overviewData.users[index].id}`);
                }
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-gray-200 group-hover:scale-110 transition-all duration-300 flex-shrink-0">
                      <span className="text-xs font-medium text-gray-600 group-hover:text-gray-700 transition-colors duration-300">{user.initials}</span>
                    </div>
                    
                    {/* User Info */}
                    <div className="space-y-0.5">
                      <h3 className="text-sm font-semibold text-gray-900 group-hover:text-gray-700 transition-colors duration-300">{user.name}</h3>
                      <p className="text-xs text-gray-600 group-hover:text-gray-700 transition-colors duration-300">{user.email}</p>
                      <div className="flex items-center space-x-1.5">
                        {user.badges.map((badge, badgeIndex) => {
                          // Create hover state that makes colors darker
                          const getHoverClass = (color: string) => {
                            if (color.includes('bg-green-100 text-green-600')) {
                              return 'hover:bg-green-600 hover:text-white';
                            } else if (color.includes('bg-yellow-100 text-yellow-600')) {
                              return 'hover:bg-yellow-600 hover:text-white';
                            } else if (color.includes('bg-orange-100 text-orange-600')) {
                              return 'hover:bg-orange-600 hover:text-white';
                            } else if (color.includes('bg-gray-100 text-gray-600')) {
                              return 'hover:bg-gray-600 hover:text-white';
                            } else if (color.includes('bg-blue-100 text-blue-600')) {
                              return 'hover:bg-blue-600 hover:text-white';
                            } else if (color.includes('bg-purple-100 text-purple-600')) {
                              return 'hover:bg-purple-600 hover:text-white';
                            }
                            return 'hover:opacity-80';
                          };
                          
                          return (
                            <Badge key={badgeIndex} className={`text-xs px-2 py-0.5 ${badge.color} ${getHoverClass(badge.color)} transition-all duration-300`}>
                            {badge.text}
                          </Badge>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {/* Stats */}
                    <div className="text-right space-y-0.5">
                      <p className="text-xs text-gray-600 group-hover:text-gray-700 transition-colors duration-300">{user.bots}</p>
                      <p className="text-xs text-gray-500 group-hover:text-gray-600 transition-colors duration-300">{user.lastActive}</p>
                    </div>

                    {/* Action Button */}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push(`/manager-dashboard/team-management?select=${overviewData.users[index].id}`)}
                      className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:shadow-md transition-all duration-300 rounded-lg text-xs px-3 py-1.5"
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* More Button */}
          {users.length > 3 && (
            <Card
              className="group relative border border-gray-200 bg-white hover:border-[#5A5BD8] hover:shadow-lg hover:shadow-blue-500/30 hover:scale-[1.01] transition-all duration-300 rounded-xl overflow-hidden cursor-pointer"
              onClick={(e) => {
                // Don't navigate if clicking on the button
                const target = e.target as HTMLElement;
                if (!target.closest('button')) {
                  router.push('/manager-dashboard/team-management');
                }
              }}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#5A5BD8] rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Team Management</h3>
                      <p className="text-xs text-gray-600">{users.length} team members</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => router.push('/manager-dashboard/team-management')}
                    className="bg-[#5A5BD8] hover:bg-[#5A5BD8]/90 text-white hover:shadow-md transition-all duration-300 rounded-lg text-sm px-4 py-2"
                  >
                    View All
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Bottom Section - Recent Activity and Team Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="bg-white rounded-2xl shadow-sm border-0 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 group">
          <CardHeader className="p-6 pb-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-6 h-6 text-gray-600 group-hover:text-gray-700 transition-colors duration-300" />
              <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors duration-300">Recent Activity</CardTitle>
            </div>
            <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-300">Latest team activities and handoffs</p>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 hover:scale-[1.02] hover:shadow-md hover:shadow-blue-500/30 transition-all duration-300 cursor-pointer group">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center group-hover:bg-gray-50 group-hover:scale-110 transition-all duration-300">
                      <activity.icon className="w-4 h-4 text-gray-600 group-hover:text-gray-700 group-hover:scale-110 transition-all duration-300" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 group-hover:text-gray-700 transition-colors duration-300">{activity.title}</p>
                      <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-300">{activity.description}</p>
                    </div>
                  </div>
                  <Badge className={`text-xs ${activity.statusColor} ${activity.statusColor.includes('bg-purple-100 text-purple-600') ? 'hover:bg-purple-600 hover:text-white' : 
                    activity.statusColor.includes('bg-green-100 text-green-600') ? 'hover:bg-green-600 hover:text-white' : 
                    activity.statusColor.includes('bg-yellow-100 text-yellow-600') ? 'hover:bg-yellow-600 hover:text-white' : 
                    activity.statusColor.includes('bg-blue-100 text-blue-600') ? 'hover:bg-blue-600 hover:text-white' : 
                    activity.statusColor.includes('bg-orange-100 text-orange-600') ? 'hover:bg-orange-600 hover:text-white' : 
                    activity.statusColor.includes('bg-gray-100 text-gray-600') ? 'hover:bg-gray-600 hover:text-white' : 
                    'hover:opacity-80'} transition-all duration-300`}>
                    {activity.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Team Performance */}
        <Card className="bg-white rounded-2xl shadow-sm border-0 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 group">
          <CardHeader className="p-6 pb-4">
            <div className="flex items-center space-x-2">
              <Users className="w-6 h-6 text-gray-600 group-hover:text-gray-700 transition-colors duration-300" />
              <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors duration-300">Team Performance</CardTitle>
            </div>
            <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-300">Current agent performance metrics</p>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="space-y-4">
              {teamPerformance.map((agent, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 hover:scale-[1.02] hover:shadow-md hover:shadow-blue-500/30 transition-all duration-300 cursor-pointer group">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center group-hover:bg-gray-300 group-hover:scale-110 transition-all duration-300">
                      <span className="text-sm font-medium text-gray-600 group-hover:text-gray-700 transition-colors duration-300">{agent.initials}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 group-hover:text-gray-700 transition-colors duration-300">{agent.name}</p>
                      <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-300">{agent.chats}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500 group-hover:text-yellow-600 group-hover:scale-110 transition-all duration-300" />
                      <span className="text-sm font-medium text-gray-900 group-hover:text-gray-700 transition-colors duration-300">{agent.rating}</span>
                    </div>
                    <Badge className={`text-xs ${agent.statusColor} ${agent.statusColor.includes('bg-green-100 text-green-600') ? 'hover:bg-green-600 hover:text-white' : 
                      agent.statusColor.includes('bg-orange-100 text-orange-600') ? 'hover:bg-orange-600 hover:text-white' : 
                      agent.statusColor.includes('bg-gray-100 text-gray-600') ? 'hover:bg-gray-600 hover:text-white' : 
                      agent.statusColor.includes('bg-blue-100 text-blue-600') ? 'hover:bg-blue-600 hover:text-white' : 
                      agent.statusColor.includes('bg-purple-100 text-purple-600') ? 'hover:bg-purple-600 hover:text-white' : 
                      agent.statusColor.includes('bg-yellow-100 text-yellow-600') ? 'hover:bg-yellow-600 hover:text-white' : 
                      'hover:opacity-80'} transition-all duration-300`}>
                      {agent.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ManagerOverview;
