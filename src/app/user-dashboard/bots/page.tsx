'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Bot,
  Eye,
  PlayCircle,
  Loader2,
  MessageSquare,
  Users,
  FileText,
  BarChart3,
  CheckCircle,
  PauseCircle,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AssignedBot {
  id: string;
  name: string;
  description: string;
  domain: string;
  status: string;
  conversations: number;
  lastActive: string;
  assignedBy: string;
  assignedAt: string;
  totalUsers?: number;
  documents?: Array<{ id: string; name: string; type: string; size: number }>;
  createdAt?: string;
  lastConversation?: string | null;
}

const BotsPage = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [bots, setBots] = useState<AssignedBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  const statusOptions = [
    { value: 'all', label: 'All Status', icon: BarChart3 },
    { value: 'active', label: 'Active', icon: CheckCircle },
    { value: 'paused', label: 'Paused', icon: PauseCircle },
    { value: 'inactive', label: 'Inactive', icon: XCircle }
  ];

  // Fetch assigned bots from API
  useEffect(() => {
    const fetchAssignedBots = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/user/assigned-bots');

        if (!response.ok) {
          throw new Error('Failed to fetch assigned bots');
        }

        const data = await response.json();
        setBots(data.bots || []);
      } catch (err) {
        console.error('Error fetching assigned bots:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch bots');
      } finally {
        setLoading(false);
      }
    };

    fetchAssignedBots();
  }, []);

  const filteredBots = bots.filter(bot => {
    const matchesSearch = bot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bot.domain.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || bot.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Assigned Bots</h1>
          <p className="text-gray-600 mt-1">
            View and interact with bots assigned to you by your manager
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search your assigned bots by name or domain..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9 text-sm border-gray-200 focus:border-[#6566F1] focus:ring-[#6566F1] bg-white rounded-lg"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
              className="h-9 px-4 py-1 text-sm border border-gray-200 rounded-lg focus:border-[#6566F1] focus:ring-[#6566F1] bg-white text-gray-900 flex items-center space-x-2 min-w-[140px] justify-between"
            >
              <span>{statusOptions.find(opt => opt.value === filterStatus)?.label || 'All Status'}</span>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isStatusDropdownOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isStatusDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
                {statusOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      onClick={() => {
                        setFilterStatus(option.value);
                        setIsStatusDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm flex items-center space-x-2 hover:bg-gray-50 ${
                        filterStatus === option.value
                          ? 'bg-[#6566F1]/10 text-[#6566F1]'
                          : 'text-gray-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#6566F1] mx-auto mb-4" />
            <p className="text-gray-600">Loading your assigned bots...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bot className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Bots</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-[#6566F1] hover:bg-[#5A5BD8] text-white"
            >
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredBots.length === 0 && searchTerm === "" && (
        <Card className="border border-gray-200 bg-white rounded-xl shadow-sm">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-[#6566F1]/10 to-[#5A5BD8]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bot className="h-8 w-8 text-[#6566F1]" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Bots Assigned Yet</h3>
            <p className="text-gray-600 mb-4 max-w-md mx-auto">
              Your manager hasn&apos;t assigned any bots to you yet. Contact your manager to get started with bot assignments.
            </p>
            <div className="bg-blue-50 rounded-lg p-4 max-w-sm mx-auto border border-blue-100">
              <p className="text-sm text-blue-800">
                Once assigned, you&apos;ll be able to test bots and view your conversation history here.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bots Grid */}
      {!loading && !error && filteredBots.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBots.map((bot) => (
            <Card key={bot.id} className="group relative border border-gray-300 bg-white hover:shadow-xl hover:shadow-[#6566F1]/10 transition-all duration-300 rounded-2xl overflow-visible hover:-translate-y-1 z-10">
              {/* Gradient Background Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#6566F1]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>

              <CardHeader className="pb-4 relative z-10">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#6566F1] to-[#5A5BD9] rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-[#6566F1]/25 transition-shadow duration-300">
                        <Bot className="h-6 w-6 text-white" />
                      </div>
                      {/* Status indicator */}
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full ${
                        bot.status === 'active' ? 'bg-green-500' :
                        bot.status === 'paused' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}></div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-lg font-semibold truncate group-hover:text-[#6566F1] transition-colors duration-200">{bot.name}</CardTitle>
                      <p className="text-sm text-gray-500 truncate">{bot.domain}</p>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 relative z-10">
                {/* Status and Last Active */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge className={`${getStatusColor(bot.status)} font-medium px-3 py-1`}>
                      {bot.status}
                    </Badge>
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{bot.lastActive}</span>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-green-50 border border-green-200 p-3 rounded-lg group-hover:bg-green-100 transition-colors duration-200">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-green-400 rounded-lg flex items-center justify-center">
                        <MessageSquare className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Conversations</p>
                        <p className="text-lg font-bold text-green-600">{bot.conversations}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#F0F0FE] border border-[#E0E0FE] p-3 rounded-lg group-hover:bg-[#E8E8FE] transition-colors duration-200">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-[#6566F1] rounded-lg flex items-center justify-center">
                        <Users className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Agents</p>
                        <p className="text-lg font-bold text-[#4A4BC8]">{bot.totalUsers || 1}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg group-hover:bg-orange-100 transition-colors duration-200 col-span-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-orange-400 rounded-lg flex items-center justify-center">
                        <FileText className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Knowledge Base</p>
                        <p className="text-lg font-bold text-orange-600">{bot.documents?.length || 0} documents</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="pt-2">
                  <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{bot.description}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-gray-300 hover:bg-[#6566F1]/10 hover:border-[#6566F1] hover:text-[#6566F1] text-gray-700 rounded-xl transition-all duration-200 group/btn"
                    onClick={() => handleNavigation(`/user-dashboard/playground?botId=${bot.id}`)}
                  >
                    <PlayCircle className="w-4 h-4 mr-2 group-hover/btn:animate-pulse" />
                    Test Bot
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-[#5A5BD9] hover:bg-[#4A4BC8] text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-[#6566F1]/25 group/btn"
                    onClick={() => handleNavigation(`/user-dashboard/conversations?botId=${bot.id}`)}
                  >
                    <Eye className="w-4 h-4 mr-2 group-hover/btn:animate-pulse" />
                    View Chats
                  </Button>
                </div>

                {/* Quick Stats Bar */}
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Assigned by: {bot.assignedBy}</span>
                    <span>On: {bot.assignedAt ? new Date(bot.assignedAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BotsPage;
