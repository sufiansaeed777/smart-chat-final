'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Bot,
  Eye,
  Edit,
  PlayCircle,
  Settings,
  Trash2,
  Loader2,
  MessageSquare,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
}

const BotsPage = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [bots, setBots] = useState<AssignedBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      case "active": return "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200 hover:text-emerald-900 hover:border-emerald-300";
      case "paused": return "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200 hover:text-amber-900 hover:border-amber-300";
      case "inactive": return "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 hover:text-gray-900 hover:border-gray-300";
      default: return "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 hover:text-gray-900 hover:border-gray-300";
    }
  };

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Assigned Bots</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              View and interact with bots assigned to you by your manager
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl border border-gray-300 p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search your assigned bots by name or domain..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-300 focus:border-[#6566F1] focus:ring-[#6566F1] rounded-xl bg-gray-50 focus:bg-white transition-colors"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:border-[#6566F1] focus:ring-[#6566F1] bg-white text-black font-medium"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="inactive">Inactive</option>
            </select>
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
          <Card className="border border-gray-300 bg-white rounded-2xl shadow-sm">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#6566F1]/10 to-[#5A5BD8]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Bot className="h-10 w-10 text-[#6566F1]" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No Bots Assigned Yet</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto leading-relaxed">
                Your manager hasn&apos;t assigned any bots to you yet. Contact your manager to get started with bot assignments.
              </p>
              <div className="bg-blue-50 rounded-lg p-4 max-w-sm mx-auto">
                <p className="text-sm text-blue-800">
                  💡 <strong>Tip:</strong> Once assigned, you&apos;ll be able to test bots and view your conversation history here.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bots Grid */}
        {filteredBots.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
            {filteredBots.map((bot) => (
              <Card key={bot.id} className="group relative bg-white/80 backdrop-blur-sm border border-gray-200/50 hover:border-[#6566F1]/30 hover:shadow-2xl hover:shadow-[#6566F1]/20 transition-all duration-500 rounded-3xl overflow-hidden hover:-translate-y-2 z-10">
                {/* Modern Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#6566F1]/8 via-transparent to-[#5A5BD9]/5 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                
                
                <CardHeader className="pb-3 relative z-10">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4 min-w-0 flex-1">
                      <div className="relative">
                        <div className="w-16 h-16 bg-gradient-to-br from-[#6566F1] to-[#5A5BD9] rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300">
                          <Bot className="h-8 w-8 text-white" />
                        </div>
                        {/* Subtle glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#6566F1] to-[#5A5BD9] rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300"></div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-xl font-bold truncate group-hover:text-[#6566F1] transition-colors duration-300 mb-1">{bot.name}</CardTitle>
                        <p className="text-sm font-medium text-gray-600 truncate mb-1">{bot.domain}</p>
                        <p className="text-xs text-gray-500 truncate">Assigned by: {bot.assignedBy}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3 relative z-10">
                  {/* Status and Last Active */}
                  <div className="flex items-center justify-between">
                    <Badge className={`${getStatusColor(bot.status)} font-semibold px-4 py-2 rounded-full shadow-sm`}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${
                        bot.status === 'active' ? 'bg-emerald-400' : 
                        bot.status === 'paused' ? 'bg-amber-400' : 'bg-gray-400'
                      }`}></div>
                      {bot.status}
                    </Badge>
                    <span className="text-sm text-gray-500 font-medium bg-gray-100/80 px-3 py-1 rounded-full">{bot.lastActive}</span>
                  </div>

                  {/* Bot Statistics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 via-blue-100/30 to-indigo-50 rounded-2xl p-4 border border-blue-200/40 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 text-center group">
                      <div className="flex items-center justify-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <Bot className="w-5 h-5 text-white" />
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

                  {/* Description */}
                  <div className="bg-gradient-to-r from-[#6566F1]/5 to-[#5A5BD9]/5 rounded-2xl p-3 border border-[#6566F1]/10">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-[#6566F1]/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <MessageSquare className="w-3 h-3 text-[#6566F1]" />
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed font-medium">{bot.description}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-1">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 h-12 border-2 border-gray-200 hover:border-[#6566F1]/30 hover:bg-[#6566F1]/5 text-gray-700 rounded-2xl font-semibold transition-all duration-300 group"
                      onClick={() => handleNavigation(`/user-dashboard/test-bot?botId=${bot.id}`)}
                    >
                      <PlayCircle className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                      Test Bot
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1 h-12 bg-gradient-to-r from-[#6566F1] to-[#5A5BD9] hover:from-[#5A5BD9] hover:to-[#4A4BC7] text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 group"
                      onClick={() => handleNavigation(`/user-dashboard/conversations?botId=${bot.id}`)}
                    >
                      <Eye className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                      View Chats
                    </Button>
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
