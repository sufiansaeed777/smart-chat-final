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
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import RoleGuard from '@/components/auth/RoleGuard';
import ProfessionalSpinner from '@/components/ui/ProfessionalSpinner';
import { useRouter } from 'next/navigation';

interface AssignedBot {
  id: string;
  name: string;
  description: string;
  domain: string;
  status: string;
  conversations: number;
  lastActive: string;
  assignedAt: string;
}

const PlaygroundPage = () => {
  const router = useRouter();
  const [bots, setBots] = useState<AssignedBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hide chat widget on playground page
  useEffect(() => {
    const widget = document.querySelector('[id*="chat"]') as HTMLElement;
    if (widget) {
      widget.style.display = 'none';
    }

    return () => {
      // Restore chat widget when leaving playground
      if (widget) {
        widget.style.display = 'block';
      }
    };
  }, []);

  useEffect(() => {
    const fetchAssignedBots = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/user/assigned-bots');
        if (response.ok) {
          const data = await response.json();
          setBots(data.bots || []);
        } else {
          setError('Failed to fetch assigned bots');
        }
      } catch (error) {
        // Error fetching assigned bots
        setError('Error loading bots');
      } finally {
        setLoading(false);
      }
    };

    fetchAssignedBots();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200 hover:text-emerald-900 hover:border-emerald-300';
      case 'paused': return 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200 hover:text-amber-900 hover:border-amber-300';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 hover:text-gray-900 hover:border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 hover:text-gray-900 hover:border-gray-300';
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
    router.push(`/user-dashboard/test-bot?botId=${botId}`);
  };

  if (loading) {
    return (
      <RoleGuard allowedRoles={['user']}>
        <ProfessionalSpinner text="Loading playground..." />
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={['user']}>
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">

        {/* Stats Cards */}
        <div className="container mx-auto px-6 pt-8 mb-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-blue-50 border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                      <Bot className="w-5 h-5 text-white" />
                </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-900 truncate">Available Bots</p>
                      <p className="text-xl font-bold text-blue-600">{bots.length}</p>
                      <p className="text-xs text-gray-600 mt-1">Total assigned</p>
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
                      <p className="text-xs font-medium text-gray-900 truncate">Total Conversations</p>
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
                      <Rocket className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-900 truncate">Test Sessions</p>
                      <p className="text-xl font-bold text-orange-600">
                    {bots.filter(bot => bot.status === 'active').length}
                  </p>
                      <p className="text-xs text-gray-600 mt-1">Available now</p>
                </div>
              </div>
            </CardContent>
          </Card>
            </div>
          </div>
        </div>

        {/* Advanced Testing Environment Section */}
        <div className="container mx-auto px-6 mb-12">
          <div className="max-w-6xl mx-auto">
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-0 rounded-3xl shadow-xl overflow-hidden">
              <CardContent className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  <div>
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-6 shadow-lg">
                      <Sparkles className="w-8 h-8 text-white" />
              </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                      Advanced Testing Environment
                    </h2>
                    <p className="text-lg text-gray-700 leading-relaxed mb-6">
                      Experience the power of AI chatbots in a controlled testing environment. 
                      Test different scenarios, analyze responses, and optimize performance 
                      before deploying to production.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <MessageSquare className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Real-time Chat</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Bot className="w-4 h-4 text-purple-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Multiple Bots</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <Zap className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Instant Testing</span>
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
                          <p className="text-sm text-gray-600">Testing different conversation flows...</p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-3">
                          <p className="text-sm text-blue-800">Analyzing response accuracy...</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3">
                          <p className="text-sm text-green-800">Performance metrics ready!</p>
                        </div>
                      </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
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
              <Card className="bg-white border border-gray-200 rounded-2xl shadow-lg">
                <CardContent className="p-12 text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Bot className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">No Bots Assigned</h3>
                  <p className="text-gray-600 mb-8 text-lg max-w-md mx-auto">
                You don&apos;t have any bots assigned to you yet. Contact your manager to get access to bots for testing.
              </p>
              <Button 
                onClick={() => router.push('/user-dashboard/bots')}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300"
              >
                View My Bots
              </Button>
            </CardContent>
          </Card>
        ) : (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Your Testing Bots</h2>
                  <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    Select a bot below to start testing and experimenting with AI conversations
                  </p>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
            {bots.map((bot) => (
                    <Card key={bot.id} className="group relative bg-white/80 backdrop-blur-sm border border-gray-200/50 hover:border-[#6566F1]/30 hover:shadow-2xl hover:shadow-[#6566F1]/20 transition-all duration-500 rounded-3xl overflow-hidden hover:-translate-y-2 z-10">
                      {/* Modern Gradient Background */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[#6566F1]/8 via-transparent to-[#5A5BD9]/5 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                      

                      <CardHeader className="pb-3 relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="relative">
                              <div className="w-16 h-16 bg-gradient-to-br from-[#6566F1] to-[#5A5BD9] rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300">
                                <Bot className="w-8 h-8 text-white" />
                              </div>
                              {/* Subtle glow effect */}
                              <div className="absolute inset-0 bg-gradient-to-br from-[#6566F1] to-[#5A5BD9] rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300"></div>
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#6566F1] transition-colors duration-300">{bot.name}</h3>
                              <p className="text-sm text-gray-600">{bot.domain}</p>
                            </div>
                          </div>
                          <Badge className={`${getStatusColor(bot.status)} font-semibold px-4 py-2 rounded-full shadow-sm`}>
                            <div className={`w-2 h-2 rounded-full mr-2 ${
                              bot.status === 'active' ? 'bg-emerald-400' : 
                              bot.status === 'paused' ? 'bg-amber-400' : 'bg-gray-400'
                            }`}></div>
                            {getStatusIcon(bot.status)}
                            <span className="ml-2 capitalize">{bot.status}</span>
                          </Badge>
                        </div>
                      </CardHeader>
                
                      <CardContent className="space-y-3">
                  {/* Description */}
                        <p className="text-gray-700 leading-relaxed">{bot.description}</p>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                          <div className="bg-gradient-to-br from-blue-50 via-blue-100/30 to-indigo-50 rounded-2xl p-4 border border-blue-200/40 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 text-center group">
                            <div className="flex items-center justify-center space-x-3 mb-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <MessageSquare className="w-5 h-5 text-white" />
                              </div>
                              <span className="text-sm font-bold text-blue-800">Chats</span>
                      </div>
                            <p className="text-3xl font-black text-blue-900 group-hover:text-blue-700 transition-colors duration-300">{bot.conversations}</p>
                    </div>
                          <div className="bg-gradient-to-br from-amber-50 via-yellow-100/30 to-orange-50 rounded-2xl p-4 border border-amber-200/40 hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300 text-center group">
                            <div className="flex items-center justify-center space-x-3 mb-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <Star className="w-5 h-5 text-white" />
                              </div>
                              <span className="text-sm font-bold text-amber-800">Rating</span>
                      </div>
                            <p className="text-3xl font-black text-amber-900 group-hover:text-amber-700 transition-colors duration-300">{(4.5 + Math.random() * 0.5).toFixed(1)}</p>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button 
                    onClick={() => handleTestBot(bot.id)}
                    disabled={bot.status !== 'active'}
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium py-4 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                          <PlayCircle className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform duration-300" />
                          {bot.status === 'active' ? 'Start Testing' : 'Bot Inactive'}
                          <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
              </>
        )}
          </div>
        </div>

        {/* Quick Tips */}
        <div className="container mx-auto px-6 pb-12">
          <div className="max-w-6xl mx-auto">
            <Card className="bg-white border border-gray-200 rounded-3xl shadow-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6">
                <CardTitle className="flex items-center space-x-3 text-2xl font-bold text-gray-900">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <span>Testing Best Practices</span>
            </CardTitle>
          </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Activity className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-gray-900 mb-3">Test Different Scenarios</h4>
                        <ul className="space-y-3 text-gray-700">
                          <li className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span>Ask questions related to the bot&apos;s domain and expertise</span>
                          </li>
                          <li className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span>Test edge cases and unusual requests to check robustness</span>
                  </li>
                          <li className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span>Try different conversation flows and user intents</span>
                  </li>
                          <li className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span>Test multilingual queries if supported</span>
                  </li>
                </ul>
              </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <BarChart3 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-gray-900 mb-3">What to Look For</h4>
                        <ul className="space-y-3 text-gray-700">
                          <li className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span>Response accuracy and relevance to the query</span>
                          </li>
                          <li className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span>Response time and consistency across tests</span>
                  </li>
                          <li className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span>Handling of unclear or complex queries gracefully</span>
                  </li>
                          <li className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span>Context awareness and conversation memory</span>
                  </li>
                </ul>
                      </div>
                    </div>
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

export default PlaygroundPage;
