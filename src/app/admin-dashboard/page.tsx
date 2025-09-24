'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Bot, 
  Users, 
  MessageSquare, 
  Activity, 
  TrendingUp, 
  Database,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Shield,
  Zap
} from 'lucide-react';

const AdminOverview: React.FC = () => {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBots: 0,
    totalConversations: 0,
    activeUsers: 0,
    systemHealth: 'healthy',
    databaseStatus: 'connected'
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAdminStats = async () => {
      try {
        setStats({
          totalUsers: 1247,
          totalBots: 89,
          totalConversations: 15678,
          activeUsers: 892,
          systemHealth: 'healthy',
          databaseStatus: 'connected'
        });
      } catch {
        // Handle error silently
      } finally {
        setLoading(false);
      }
    };

    loadAdminStats();
  }, []);

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const quickActions = [
    {
      title: 'User Management',
      description: 'Manage users, roles, and permissions',
      icon: Users,
      path: '/admin-dashboard/user-management',
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      title: 'System Health',
      description: 'Monitor system performance and health',
      icon: Activity,
      path: '/admin-dashboard/system-health',
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      title: 'Database',
      description: 'Database management and backups',
      icon: Database,
      path: '/admin-dashboard/database',
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600'
    },
    {
      title: 'All Bots',
      description: 'View and manage all bots in the system',
      icon: Bot,
      path: '/admin-dashboard/bots',
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600'
    }
  ];

  const recentActivities = [
    {
      type: 'user_registration',
      message: 'New user registered: john.doe@example.com',
      time: '2 minutes ago',
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50'
    },
    {
      type: 'bot_created',
      message: 'New bot created: Customer Support Bot',
      time: '15 minutes ago',
      icon: Bot,
      color: 'text-green-500',
      bgColor: 'bg-green-50'
    },
    {
      type: 'system_alert',
      message: 'High memory usage detected on server-01',
      time: '1 hour ago',
      icon: AlertTriangle,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50'
    },
    {
      type: 'backup_completed',
      message: 'Daily database backup completed successfully',
      time: '2 hours ago',
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-50'
    }
  ];

  if (loading) {
    return (
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border-0">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
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
          <h1 className="text-3xl font-bold text-gray-900">Admin Overview</h1>
          <p className="text-gray-600 mt-2">System administration and monitoring dashboard</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>System Healthy</span>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border-0 hover:shadow-purple-500/20 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group"
             onClick={() => handleNavigation('/admin-dashboard/user-management')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <TrendingUp className="w-4 h-4 mr-1" />
                +12% this month
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-purple-50 transition-colors duration-300">
              <Users className="w-6 h-6 text-blue-600 group-hover:text-purple-600 transition-colors duration-300" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border-0 hover:shadow-purple-500/20 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group"
             onClick={() => handleNavigation('/admin-dashboard/bots')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Bots</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalBots}</p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <TrendingUp className="w-4 h-4 mr-1" />
                +8% this month
              </p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center group-hover:bg-purple-50 transition-colors duration-300">
              <Bot className="w-6 h-6 text-green-600 group-hover:text-purple-600 transition-colors duration-300" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border-0 hover:shadow-purple-500/20 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group"
             onClick={() => handleNavigation('/admin-dashboard/analytics')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Conversations</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalConversations.toLocaleString()}</p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <TrendingUp className="w-4 h-4 mr-1" />
                +15% this month
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center group-hover:bg-purple-100 transition-colors duration-300">
              <MessageSquare className="w-6 h-6 text-purple-600 group-hover:text-purple-700 transition-colors duration-300" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border-0 hover:shadow-purple-500/20 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group"
             onClick={() => handleNavigation('/admin-dashboard/user-management')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-3xl font-bold text-gray-900">{stats.activeUsers}</p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <TrendingUp className="w-4 h-4 mr-1" />
                +5% today
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center group-hover:bg-purple-50 transition-colors duration-300">
              <Activity className="w-6 h-6 text-orange-600 group-hover:text-purple-600 transition-colors duration-300" />
            </div>
          </div>
        </div>
      </div>

      {/* System Status and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border-0 hover:shadow-purple-500/10 hover:shadow-lg transition-all duration-300">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Shield className="w-6 h-6 mr-2 text-[#6566F1]" />
            System Status
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-purple-50 hover:shadow-purple-500/10 hover:shadow-md hover:scale-[1.02] transition-all duration-300 cursor-pointer group"
                 onClick={() => handleNavigation('/admin-dashboard/database')}>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center group-hover:bg-purple-50 transition-colors duration-300">
                  <CheckCircle className="w-6 h-6 text-green-600 group-hover:text-purple-600 transition-colors duration-300" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 group-hover:text-purple-700 transition-colors duration-300">Database</p>
                  <p className="text-sm text-gray-600">PostgreSQL</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full group-hover:bg-purple-100 group-hover:text-purple-800 transition-colors duration-300">
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-purple-50 hover:shadow-purple-500/10 hover:shadow-md hover:scale-[1.02] transition-all duration-300 cursor-pointer group"
                 onClick={() => handleNavigation('/admin-dashboard/system-health')}>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center group-hover:bg-purple-50 transition-colors duration-300">
                  <CheckCircle className="w-6 h-6 text-green-600 group-hover:text-purple-600 transition-colors duration-300" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 group-hover:text-purple-700 transition-colors duration-300">API Services</p>
                  <p className="text-sm text-gray-600">All endpoints</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full group-hover:bg-purple-100 group-hover:text-purple-800 transition-colors duration-300">
                Operational
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-purple-50 hover:shadow-purple-500/10 hover:shadow-md hover:scale-[1.02] transition-all duration-300 cursor-pointer group"
                 onClick={() => handleNavigation('/admin-dashboard/settings')}>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center group-hover:bg-purple-50 transition-colors duration-300">
                  <Clock className="w-6 h-6 text-yellow-600 group-hover:text-purple-600 transition-colors duration-300" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 group-hover:text-purple-700 transition-colors duration-300">N8N Integration</p>
                  <p className="text-sm text-gray-600">Webhook service</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full group-hover:bg-purple-100 group-hover:text-purple-800 transition-colors duration-300">
                Configured
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border-0">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Zap className="w-6 h-6 mr-2 text-[#6566F1]" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  onClick={() => handleNavigation(action.path)}
                  className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 hover:scale-105 hover:shadow-purple-500/10 hover:shadow-lg transition-all duration-300 text-left group"
                >
                  <div className={`w-10 h-10 ${action.bgColor} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-purple-50 transition-all duration-300`}>
                    <Icon className={`w-6 h-6 ${action.iconColor} group-hover:text-purple-600 transition-colors duration-300`} />
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm group-hover:text-purple-700 transition-colors duration-300">{action.title}</h4>
                  <p className="text-xs text-gray-600 mt-1">{action.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border-0">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <BarChart3 className="w-6 h-6 mr-2 text-[#6566F1]" />
          Recent Activity
        </h3>
        <div className="space-y-4">
          {recentActivities.map((activity, index) => {
            const Icon = activity.icon;
            return (
              <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 hover:scale-[1.02] hover:shadow-purple-500/10 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                   onClick={() => {
                     // Navigate based on activity type
                     if (activity.type === 'user_registration') {
                       handleNavigation('/admin-dashboard/user-management');
                     } else if (activity.type === 'bot_created') {
                       handleNavigation('/admin-dashboard/bots');
                     } else if (activity.type === 'system_alert') {
                       handleNavigation('/admin-dashboard/system-health');
                     } else if (activity.type === 'backup_completed') {
                       handleNavigation('/admin-dashboard/database');
                     }
                   }}>
                <div className={`w-10 h-10 ${activity.bgColor} rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${activity.color}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-600">{activity.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
