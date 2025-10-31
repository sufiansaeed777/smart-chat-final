'use client';

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Server, 
  Database, 
  Globe,
  Cpu,
  HardDrive,
  Wifi,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Settings,
  Bell,
  Shield
} from 'lucide-react';

interface SystemMetric {
  name: string;
  value: string;
  status: 'healthy' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  change: number;
  icon: React.ComponentType<{ className?: string }>;
}

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'outage';
  uptime: string;
  responseTime: string;
  lastCheck: string;
}

const SystemHealthPage: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    const loadSystemHealth = async () => {
      try {
        const response = await fetch('/api/admin/system-health');

        if (response.ok) {
          const data = await response.json();
          const systemData = data.system;

          // Map API data to metrics
          setMetrics([
            {
              name: 'CPU Usage',
              value: `${systemData.cpu.usagePercent}%`,
              status: systemData.cpu.status as 'healthy' | 'warning' | 'critical',
              trend: parseFloat(systemData.cpu.usagePercent) > 50 ? 'up' : 'stable',
              change: 2.3,
              icon: Cpu
            },
            {
              name: 'Memory Usage',
              value: `${systemData.memory.usagePercent}%`,
              status: systemData.memory.status as 'healthy' | 'warning' | 'critical',
              trend: parseFloat(systemData.memory.usagePercent) > 60 ? 'up' : 'stable',
              change: 5.1,
              icon: HardDrive
            },
            {
              name: 'Total Memory',
              value: systemData.memory.total,
              status: 'healthy',
              trend: 'stable',
              change: 0.2,
              icon: Database
            },
            {
              name: 'Uptime',
              value: systemData.uptime.formatted,
              status: 'healthy',
              trend: 'up',
              change: 0,
              icon: Clock
            },
            {
              name: 'Database Response',
              value: systemData.database.responseTime,
              status: systemData.database.health === 'excellent' ? 'healthy' : 'warning',
              trend: 'down',
              change: -8.2,
              icon: Globe
            },
            {
              name: 'Database Status',
              value: systemData.database.status,
              status: systemData.database.status === 'connected' ? 'healthy' : 'critical',
              trend: 'stable',
              change: 0,
              icon: Server
            }
          ]);

          // Mock services for now (can be extended later)
          setServices([
            {
              name: 'Database',
              status: systemData.database.status === 'connected' ? 'operational' : 'outage',
              uptime: '99.8%',
              responseTime: systemData.database.responseTime,
              lastCheck: 'Just now'
            },
            {
              name: 'API Gateway',
              status: 'operational',
              uptime: '99.9%',
              responseTime: '45ms',
              lastCheck: 'Just now'
            },
            {
              name: 'Authentication Service',
              status: 'operational',
              uptime: '99.9%',
              responseTime: '23ms',
              lastCheck: 'Just now'
            },
            {
              name: 'CPU Monitor',
              status: systemData.cpu.status === 'healthy' ? 'operational' : 'degraded',
              uptime: '100%',
              responseTime: '<1ms',
              lastCheck: 'Just now'
            },
            {
              name: 'Memory Monitor',
              status: systemData.memory.status === 'healthy' ? 'operational' : 'degraded',
              uptime: '100%',
              responseTime: '<1ms',
              lastCheck: 'Just now'
            }
          ]);
        } else {
          console.error('Failed to fetch system health');
          // Fallback to empty state
          setMetrics([]);
          setServices([]);
        }
      } catch (error) {
        console.error('Error loading system health:', error);
        // Fallback to empty state
        setMetrics([]);
        setServices([]);
      } finally {
        setLoading(false);
      }
    };

    loadSystemHealth();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      setLastUpdated(new Date());
      loadSystemHealth();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    setLastUpdated(new Date());

    try {
      const response = await fetch('/api/admin/system-health');
      if (response.ok) {
        const data = await response.json();
        const systemData = data.system;

        setMetrics([
          {
            name: 'CPU Usage',
            value: `${systemData.cpu.usagePercent}%`,
            status: systemData.cpu.status as 'healthy' | 'warning' | 'critical',
            trend: parseFloat(systemData.cpu.usagePercent) > 50 ? 'up' : 'stable',
            change: 2.3,
            icon: Cpu
          },
          {
            name: 'Memory Usage',
            value: `${systemData.memory.usagePercent}%`,
            status: systemData.memory.status as 'healthy' | 'warning' | 'critical',
            trend: parseFloat(systemData.memory.usagePercent) > 60 ? 'up' : 'stable',
            change: 5.1,
            icon: HardDrive
          },
          {
            name: 'Total Memory',
            value: systemData.memory.total,
            status: 'healthy',
            trend: 'stable',
            change: 0.2,
            icon: Database
          },
          {
            name: 'Uptime',
            value: systemData.uptime.formatted,
            status: 'healthy',
            trend: 'up',
            change: 0,
            icon: Clock
          },
          {
            name: 'Database Response',
            value: systemData.database.responseTime,
            status: systemData.database.health === 'excellent' ? 'healthy' : 'warning',
            trend: 'down',
            change: -8.2,
            icon: Globe
          },
          {
            name: 'Database Status',
            value: systemData.database.status,
            status: systemData.database.status === 'connected' ? 'healthy' : 'critical',
            trend: 'stable',
            change: 0,
            icon: Server
          }
        ]);

        setServices([
          {
            name: 'Database',
            status: systemData.database.status === 'connected' ? 'operational' : 'outage',
            uptime: '99.8%',
            responseTime: systemData.database.responseTime,
            lastCheck: 'Just now'
          },
          {
            name: 'API Gateway',
            status: 'operational',
            uptime: '99.9%',
            responseTime: '45ms',
            lastCheck: 'Just now'
          },
          {
            name: 'Authentication Service',
            status: 'operational',
            uptime: '99.9%',
            responseTime: '23ms',
            lastCheck: 'Just now'
          },
          {
            name: 'CPU Monitor',
            status: systemData.cpu.status === 'healthy' ? 'operational' : 'degraded',
            uptime: '100%',
            responseTime: '<1ms',
            lastCheck: 'Just now'
          },
          {
            name: 'Memory Monitor',
            status: systemData.memory.status === 'healthy' ? 'operational' : 'degraded',
            uptime: '100%',
            responseTime: '<1ms',
            lastCheck: 'Just now'
          }
        ]);
      }
    } catch (error) {
      console.error('Error refreshing system health:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'operational':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
      case 'degraded':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical':
      case 'outage':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'operational':
        return <CheckCircle className="w-5 h-5" />;
      case 'warning':
      case 'degraded':
        return <AlertTriangle className="w-5 h-5" />;
      case 'critical':
      case 'outage':
        return <XCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-red-600" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-green-600" />;
      default:
        return <div className="w-4 h-4 bg-gray-400 rounded-full"></div>;
    }
  };

  const overallHealth = services.filter(s => s.status === 'operational').length / services.length * 100;

  if (loading) {
    return (
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
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
          <h1 className="text-3xl font-bold text-gray-900">System Health</h1>
          <p className="text-gray-600 mt-2">Monitor system performance and health metrics</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          </div>
          <button onClick={handleRefresh} disabled={loading} className="flex items-center space-x-2 bg-white text-gray-700 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Overall Health Status */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${getStatusColor(overallHealth >= 95 ? 'healthy' : overallHealth >= 80 ? 'warning' : 'critical')}`}>
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">System Health</h2>
              <p className="text-gray-600">Overall system status and performance</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold text-gray-900">{overallHealth.toFixed(1)}%</p>
            <p className="text-sm text-gray-600">Operational</p>
          </div>
        </div>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border-0 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getStatusColor(metric.status)}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex items-center space-x-1">
                  {getTrendIcon(metric.trend)}
                  <span className={`text-sm font-medium ${metric.trend === 'up' ? 'text-red-600' : metric.trend === 'down' ? 'text-green-600' : 'text-gray-600'}`}>
                    {metric.change > 0 ? '+' : ''}{metric.change}%
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">{metric.name}</p>
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                <div className="flex items-center mt-2">
                  {getStatusIcon(metric.status)}
                  <span className="ml-2 text-sm font-medium capitalize">{metric.status}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Services Status */}
      <div className="bg-white rounded-2xl shadow-sm border-0 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <Server className="w-6 h-6 mr-2 text-[#6566F1]" />
            Services Status
          </h3>
          <p className="text-gray-600 mt-1">Real-time status of all system services</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Uptime
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Response Time
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Last Check
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {services.map((service, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                        <Server className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-gray-900">{service.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full border flex items-center w-fit ${getStatusColor(service.status)}`}>
                      {getStatusIcon(service.status)}
                      <span className="ml-1 capitalize">{service.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {service.uptime}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {service.responseTime}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {service.lastCheck}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button className="text-[#6566F1] hover:text-[#5A5BD9] p-2 rounded-lg hover:bg-[#6566F1]/10 transition-colors">
                        <Settings className="w-4 h-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                        <Bell className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border-0">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <Bell className="w-6 h-6 mr-2 text-[#6566F1]" />
          Recent Alerts
        </h3>
        <div className="space-y-4">
          {[
            {
              type: 'warning',
              message: 'High memory usage detected on server-01',
              time: '15 minutes ago',
              service: 'Memory Monitor'
            },
            {
              type: 'info',
              message: 'Scheduled maintenance completed successfully',
              time: '2 hours ago',
              service: 'System Maintenance'
            },
            {
              type: 'critical',
              message: 'Database connection pool exhausted',
              time: '3 hours ago',
              service: 'Database'
            }
          ].map((alert, index) => (
            <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                alert.type === 'critical' ? 'bg-red-50 text-red-600' :
                alert.type === 'warning' ? 'bg-yellow-50 text-yellow-600' :
                'bg-blue-50 text-blue-600'
              }`}>
                {alert.type === 'critical' ? <XCircle className="w-5 h-5" /> :
                 alert.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> :
                 <CheckCircle className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{alert.message}</p>
                <p className="text-xs text-gray-600">{alert.service} • {alert.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SystemHealthPage;
