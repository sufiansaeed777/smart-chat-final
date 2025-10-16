'use client';

import React, { useState, useEffect } from 'react';
import {
  PlayCircle,
  Bot,
  MessageSquare,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertTriangle
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
        setError('Error loading bots');
      } finally {
        setLoading(false);
      }
    };

    fetchAssignedBots();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-600';
      case 'paused': return 'bg-yellow-100 text-yellow-600';
      case 'inactive': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
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

  const metrics = [
    {
      title: "Available Bots",
      value: bots.length.toString(),
      change: "Total assigned",
      icon: Bot,
      bgColor: "bg-purple-50",
      iconBg: "bg-purple-500",
      textColor: "text-purple-600"
    },
    {
      title: "Active Bots",
      value: bots.filter(bot => bot.status === 'active').length.toString(),
      change: "Ready for testing",
      icon: CheckCircle,
      bgColor: "bg-green-50",
      iconBg: "bg-green-500",
      textColor: "text-green-600"
    },
    {
      title: "Total Conversations",
      value: bots.reduce((sum, bot) => sum + bot.conversations, 0).toString(),
      change: "All time",
      icon: MessageSquare,
      bgColor: "bg-blue-50",
      iconBg: "bg-blue-500",
      textColor: "text-blue-600"
    },
    {
      title: "Test Sessions",
      value: bots.filter(bot => bot.status === 'active').length.toString(),
      change: "Available now",
      icon: PlayCircle,
      bgColor: "bg-orange-50",
      iconBg: "bg-orange-500",
      textColor: "text-orange-600"
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

        {/* Bots List */}
        {error ? (
          <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Error Loading Bots</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button
                onClick={() => window.location.reload()}
                className="bg-[#5A5BD8] hover:bg-[#5A5BD8]/90 text-white"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : bots.length === 0 ? (
          <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bot className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Bots Assigned</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                You don&apos;t have any bots assigned to you yet. Contact your manager to get access to bots for testing.
              </p>
              <Button
                onClick={() => router.push('/user-dashboard/bots')}
                className="bg-[#5A5BD8] hover:bg-[#5A5BD8]/90 text-white"
              >
                View My Bots
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="bg-white rounded-2xl shadow-sm border-0">
              <CardHeader className="p-6 pb-4">
                <CardTitle className="text-xl font-bold text-gray-900">Your Testing Bots</CardTitle>
                <p className="text-sm text-gray-600">Select a bot below to start testing</p>
              </CardHeader>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bots.map((bot) => (
                <Card key={bot.id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 group">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-[#5A5BD8] rounded-lg flex items-center justify-center">
                          <Bot className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{bot.name}</h3>
                          <p className="text-sm text-gray-600">{bot.domain}</p>
                        </div>
                      </div>
                      <Badge className={`${getStatusColor(bot.status)} text-xs px-2 py-1`}>
                        {getStatusIcon(bot.status)}
                        <span className="ml-1 capitalize">{bot.status}</span>
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-700">{bot.description}</p>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <MessageSquare className="w-4 h-4 text-gray-600 mx-auto mb-1" />
                        <p className="text-lg font-bold text-gray-900">{bot.conversations}</p>
                        <p className="text-xs text-gray-600">Conversations</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <Clock className="w-4 h-4 text-gray-600 mx-auto mb-1" />
                        <p className="text-lg font-bold text-gray-900">{bot.lastActive}</p>
                        <p className="text-xs text-gray-600">Last Active</p>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleTestBot(bot.id)}
                      disabled={bot.status !== 'active'}
                      className="w-full bg-[#5A5BD8] hover:bg-[#5A5BD8]/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <PlayCircle className="w-4 h-4 mr-2" />
                      {bot.status === 'active' ? 'Start Testing' : 'Bot Inactive'}
                      <ArrowRight className="w-4 h-4 ml-auto" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </RoleGuard>
  );
};

export default PlaygroundPage;
