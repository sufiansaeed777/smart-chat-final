'use client';

import React, { useState, useEffect } from 'react';
import { 
  PlayCircle, 
  Bot, 
  MessageSquare, 
  ArrowRight, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Zap,
  Sparkles,
  BarChart3,
  Users,
  TrendingUp,
  Shield,
  Rocket,
  Star,
  Activity,
  Plus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import RoleGuard from '@/components/auth/RoleGuard';
import ProfessionalSpinner from '@/components/ui/ProfessionalSpinner';
import { useRouter } from 'next/navigation';

interface ManagerBot {
  id: string;
  name: string;
  description: string;
  domain: string;
  status: string;
  conversations: number;
  lastActive: string;
  createdAt: string;
  createdBy: string;
}

const ManagerPlaygroundPage = () => {
  const router = useRouter();
  const [bots, setBots] = useState<ManagerBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchManagerBots = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/manager/bots');
        if (response.ok) {
          const data = await response.json();
          setBots(data.bots || []);
        } else {
          setError('Failed to fetch manager bots');
        }
      } catch (error) {
        setError('Error loading bots');
      } finally {
        setLoading(false);
      }
    };

    fetchManagerBots();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'paused': return <Clock className="w-4 h-4" />;
      case 'inactive': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const handleTestBot = (botId: string) => {
    router.push(`/manager-dashboard/test-bot?botId=${botId}`);
  };

  const handleCreateBot = () => {
    router.push('/manager-dashboard/manager-bots');
  };

  if (loading) {
    return (
      <RoleGuard allowedRoles={['manager']}>
        <ProfessionalSpinner text="Loading playground..." />
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={['manager']}>
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">

        {/* Advanced Testing Environment Section */}
        <div className="container mx-auto px-6 pt-8 mb-8">
          <div className="max-w-6xl mx-auto">
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-0 rounded-3xl shadow-xl overflow-hidden">
              <CardContent className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  <div>
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-6 shadow-lg">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                      Manager Testing Environment
                    </h2>
                    <p className="text-lg text-gray-700 leading-relaxed mb-6">
                      Test and optimize your bot creations in a controlled environment. 
                      Analyze performance, test different scenarios, and ensure your bots 
                      are ready for production deployment.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <MessageSquare className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Real-time Testing</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Bot className="w-4 h-4 text-purple-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">All Your Bots</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <Zap className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Instant Analysis</span>
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      </div>
                      <div className="space-y-3">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm text-gray-600">Testing bot performance metrics...</p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-3">
                          <p className="text-sm text-blue-800">Analyzing conversation flows...</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3">
                          <p className="text-sm text-green-800">Optimization complete!</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="container mx-auto px-6 mb-12">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-blue-50 border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-900 truncate">Total Bots</p>
                      <p className="text-xl font-bold text-blue-600">{bots.length}</p>
                      <p className="text-xs text-gray-600 mt-1">Created by you</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-50 border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-900 truncate">Active Bots</p>
                      <p className="text-xl font-bold text-green-600">
                        {bots.filter(bot => bot.status === 'active').length}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">Ready for testing</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-purple-50 border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                      <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-900 truncate">Total Chats</p>
                      <p className="text-xl font-bold text-purple-600">
                        {bots.reduce((sum, bot) => sum + bot.conversations, 0)}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">All time</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-orange-50 border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                      <Activity className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-900 truncate">Avg Rating</p>
                      <p className="text-xl font-bold text-orange-600">4.8</p>
                      <p className="text-xs text-gray-600 mt-1">Customer satisfaction</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Bots Grid */}
        <div className="container mx-auto px-6 mb-12">
          <div className="max-w-6xl mx-auto">
            {error ? (
              <Card className="bg-white border border-red-200 rounded-2xl shadow-lg">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-red-900 mb-3">Error Loading Bots</h3>
                  <p className="text-red-700 mb-6 text-lg">{error}</p>
                  <Button 
                    onClick={() => window.location.reload()}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            ) : bots.length === 0 ? (
              <Card className="bg-white rounded-2xl shadow-lg">
                <CardContent className="p-12 text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Bot className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">No Bots Created Yet</h3>
                  <p className="text-gray-600 mb-8 text-lg max-w-md mx-auto">
                    Create your first bot to start testing in the playground environment.
                  </p>
                  <Button 
                    onClick={handleCreateBot}
                    className="bg-[#6566F1] hover:bg-[#5A5BD8] text-white px-8 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create Your First Bot
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Your Bots</h2>
                    <p className="text-gray-600 mt-1">Test and experiment with your created bots</p>
                  </div>
                  <Button 
                    onClick={handleCreateBot}
                    variant="outline"
                    className="border-[#6566F1] text-[#6566F1] hover:bg-[#6566F1] hover:text-white px-4 py-2 rounded-xl font-medium transition-all duration-300"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Bot
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {bots.map((bot) => (
                    <Card key={bot.id} className="group bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200 overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                              <Bot className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-gray-900 group-hover:text-gray-700 transition-colors duration-300">{bot.name}</h3>
                              <p className="text-sm text-gray-600">{bot.domain}</p>
                            </div>
                          </div>
                          <Badge className={`text-xs px-3 py-1 rounded-full border ${getStatusColor(bot.status)} group-hover:scale-105 transition-transform duration-300`}>
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(bot.status)}
                              <span className="capitalize">{bot.status}</span>
                            </div>
                          </Badge>
                        </div>

                        <p className="text-gray-600 text-sm mb-4 line-clamp-2 group-hover:text-gray-700 transition-colors duration-300">
                          {bot.description}
                        </p>

                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                              <MessageSquare className="w-4 h-4" />
                              <span>{bot.conversations} chats</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{bot.lastActive}</span>
                            </div>
                          </div>
                        </div>

                        <Button 
                          onClick={() => handleTestBot(bot.id)}
                          className="w-full bg-[#6566F1] hover:bg-[#5A5BD8] text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 group"
                        >
                          <PlayCircle className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                          Test Bot
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Tips Section */}
        <div className="container mx-auto px-6 pb-12">
          <div className="max-w-6xl mx-auto">
            <Card className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl shadow-sm border border-gray-200">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg mb-4">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">Testing Best Practices</h2>
                  <p className="text-gray-600 max-w-2xl mx-auto">
                    Get the most out of your bot testing with these proven strategies
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center group">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                      <MessageSquare className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Test Different Scenarios</h3>
                    <p className="text-sm text-gray-600">
                      Try various conversation flows, edge cases, and unexpected inputs to ensure robust performance.
                    </p>
                  </div>

                  <div className="text-center group">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                      <BarChart3 className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Monitor Performance</h3>
                    <p className="text-sm text-gray-600">
                      Track response times, accuracy rates, and user satisfaction to optimize your bot&apos;s effectiveness.
                    </p>
                  </div>

                  <div className="text-center group">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Shield className="w-6 h-6 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Iterate and Improve</h3>
                    <p className="text-sm text-gray-600">
                      Use test results to refine your bot&apos;s responses and improve the overall user experience.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
};

export default ManagerPlaygroundPage;
