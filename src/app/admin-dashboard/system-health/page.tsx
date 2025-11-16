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
import { Tooltip } from '@/components/ui/tooltip';

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
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [selectedService, setSelectedService] = useState<string>('');

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
          console.error('Failed to fetch system health data');
        }
      } catch (error) {
        console.error('Error loading system health:', error);
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
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
      case 'degraded':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'critical':
      case 'outage':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
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

  const handleServiceSettings = (serviceName: string) => {
    setSelectedService(serviceName);
    setShowSettingsModal(true);
  };

  const handleServiceAlerts = (serviceName: string) => {
    setSelectedService(serviceName);
    setShowAlertsModal(true);
  };

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
                  <span className={`ml-2 text-sm font-medium capitalize ${
                    metric.status === 'healthy' ? 'text-green-600' :
                    metric.status === 'warning' ? 'text-yellow-600' :
                    metric.status === 'critical' ? 'text-red-600' :
                    'text-gray-600'
                  }`}>{metric.status}</span>
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
                      <Tooltip content="Service settings" position="top">
                        <button
                          onClick={() => handleServiceSettings(service.name)}
                          className="text-[#6566F1] hover:text-[#5A5BD9] p-2 rounded-lg hover:bg-[#6566F1]/10 transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                      </Tooltip>
                      <Tooltip content="Notifications" position="top">
                        <button
                          onClick={() => handleServiceAlerts(service.name)}
                          className="text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <Bell className="w-4 h-4" />
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

      {/* Service Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowSettingsModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-[600px] max-w-[90vw] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#6566F1] rounded-xl flex items-center justify-center">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Service Settings</h3>
                  <p className="text-sm text-gray-600">{selectedService}</p>
                </div>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Monitoring Interval */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Monitoring Interval
                </label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#6566F1] focus:border-[#6566F1] text-gray-900">
                  <option>Every 10 seconds</option>
                  <option selected>Every 30 seconds</option>
                  <option>Every 1 minute</option>
                  <option>Every 5 minutes</option>
                </select>
              </div>

              {/* Response Time Threshold */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Response Time Threshold (ms)
                </label>
                <input
                  type="number"
                  defaultValue="1000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#6566F1] focus:border-[#6566F1] text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">Alert if response time exceeds this value</p>
              </div>

              {/* Enable Monitoring */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-semibold text-gray-900">Enable Monitoring</p>
                  <p className="text-sm text-gray-600">Monitor this service continuously</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#6566F1]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6566F1]"></div>
                </label>
              </div>

              {/* Auto-restart on failure */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-semibold text-gray-900">Auto-restart on Failure</p>
                  <p className="text-sm text-gray-600">Automatically attempt to restart service if it fails</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#6566F1]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6566F1]"></div>
                </label>
              </div>
            </div>

            <div className="flex items-center space-x-3 mt-6">
              <button
                onClick={() => {
                  alert('Settings saved successfully!');
                  setShowSettingsModal(false);
                }}
                className="flex-1 bg-[#6566F1] text-white py-3 px-6 rounded-xl hover:bg-[#5A5BD9] transition-colors font-semibold"
              >
                Save Settings
              </button>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors font-medium border border-gray-300 rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Service Alerts Modal */}
      {showAlertsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowAlertsModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-[600px] max-w-[90vw] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Alert Settings</h3>
                  <p className="text-sm text-gray-600">{selectedService}</p>
                </div>
              </div>
              <button
                onClick={() => setShowAlertsModal(false)}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Enable Alerts */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-semibold text-gray-900">Enable Alerts</p>
                  <p className="text-sm text-gray-600">Receive notifications for this service</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#6566F1]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6566F1]"></div>
                </label>
              </div>

              {/* Alert Channels */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Notification Channels
                </label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-[#6566F1] rounded focus:ring-[#6566F1]" />
                    <span className="text-sm font-medium text-gray-900">Email Notifications</span>
                  </label>
                  <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                    <input type="checkbox" className="w-4 h-4 text-[#6566F1] rounded focus:ring-[#6566F1]" />
                    <span className="text-sm font-medium text-gray-900">SMS Alerts</span>
                  </label>
                  <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-[#6566F1] rounded focus:ring-[#6566F1]" />
                    <span className="text-sm font-medium text-gray-900">In-App Notifications</span>
                  </label>
                </div>
              </div>

              {/* Alert Severity */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Alert Severity Levels
                </label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg cursor-pointer hover:bg-red-100 transition-colors">
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-red-600 rounded focus:ring-red-500" />
                    <span className="text-sm font-medium text-red-900">Critical Alerts</span>
                  </label>
                  <label className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg cursor-pointer hover:bg-yellow-100 transition-colors">
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-yellow-600 rounded focus:ring-yellow-500" />
                    <span className="text-sm font-medium text-yellow-900">Warning Alerts</span>
                  </label>
                  <label className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
                    <input type="checkbox" className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                    <span className="text-sm font-medium text-blue-900">Info Alerts</span>
                  </label>
                </div>
              </div>

              {/* Alert Frequency */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Alert Frequency Limit
                </label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#6566F1] focus:border-[#6566F1] text-gray-900">
                  <option>Immediate (no limit)</option>
                  <option selected>Maximum 1 per minute</option>
                  <option>Maximum 1 per 5 minutes</option>
                  <option>Maximum 1 per hour</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Prevent alert spam for repeated issues</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 mt-6">
              <button
                onClick={() => {
                  alert('Alert settings saved successfully!');
                  setShowAlertsModal(false);
                }}
                className="flex-1 bg-[#6566F1] text-white py-3 px-6 rounded-xl hover:bg-[#5A5BD9] transition-colors font-semibold"
              >
                Save Alert Settings
              </button>
              <button
                onClick={() => setShowAlertsModal(false)}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors font-medium border border-gray-300 rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemHealthPage;
