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
      case "active": return "bg-green-100 text-green-800 border-green-200";
      case "paused": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "inactive": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
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
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-9 px-3 py-1 text-sm border border-gray-200 rounded-lg focus:border-[#6566F1] focus:ring-[#6566F1] bg-white text-gray-900"
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
                  💡 <strong>Tip:</strong> Once assigned, you&apos;ll be able to test bots and view your conversation history here.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bots Grid */}
        {filteredBots.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBots.map((bot) => (
              <Card key={bot.id} className="border border-gray-200 bg-white hover:shadow-md transition-shadow rounded-2xl">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className="w-10 h-10 bg-[#6566F1] rounded-lg flex items-center justify-center">
                        <Bot className="h-5 w-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-lg truncate">{bot.name}</CardTitle>
                        <p className="text-sm text-gray-500 truncate">{bot.domain}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Status and Last Active */}
                  <div className="flex items-center justify-between">
                    <Badge className={`${getStatusColor(bot.status)} text-xs`}>
                      {bot.status}
                    </Badge>
                    <span className="text-sm text-gray-500">{bot.lastActive}</span>
                  </div>

                  {/* Bot Statistics */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="w-4 h-4 text-gray-400" />
                        <span>{bot.conversations} conversations</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span>{(4.5 + Math.random() * 0.5).toFixed(1)} rating</span>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="pt-2">
                    <p className="text-sm text-gray-600 line-clamp-2">{bot.description}</p>
                  </div>

                  {/* Assigned By */}
                  <div className="text-xs text-gray-500 border-t border-gray-100 pt-2">
                    Assigned by: {bot.assignedBy}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-gray-300 hover:bg-gray-50 text-gray-700 rounded-2xl"
                      onClick={() => handleNavigation(`/user-dashboard/test-bot?botId=${bot.id}`)}
                    >
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Test Bot
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-[#6566F1] hover:bg-[#5A5BD9] text-white rounded-2xl"
                      onClick={() => handleNavigation(`/user-dashboard/conversations?botId=${bot.id}`)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
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
