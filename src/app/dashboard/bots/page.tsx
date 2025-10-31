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
  Trash2
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
import DashboardLayoutWithAuth from '@/components/dashboard/DashboardLayoutWithAuth';

const BotsPage = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [bots, setBots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBots = async () => {
      try {
        const response = await fetch('/api/user/assigned-bots');

        if (response.ok) {
          const data = await response.json();
          setBots(data.bots || []);
        } else {
          console.error('Failed to fetch bots:', response.statusText);
          setBots([]);
        }
      } catch (error) {
        console.error('Error loading bots:', error);
        setBots([]);
      } finally {
        setLoading(false);
      }
    };

    loadBots();
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
    <DashboardLayoutWithAuth activeSection="bots">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Bots</h1>
            <p className="text-gray-600 mt-1">
              Create and manage your AI-powered chatbots
            </p>
          </div>
          <Button 
            className="bg-[#6566F1] hover:bg-[#5A5BD8] text-white rounded-2xl"
            onClick={() => handleNavigation('/dashboard/bots')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Bot
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search bots by name or domain..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-gray-300 focus:border-[#6566F1] focus:ring-[#6566F1] rounded-2xl"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-2xl focus:border-[#6566F1] focus:ring-[#6566F1] bg-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6566F1]"></div>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredBots.length === 0 && searchTerm === "" && (
          <Card className="border border-gray-200 bg-white rounded-2xl">
            <CardContent className="p-12 text-center">
              <Bot className="h-16 w-16 text-gray-400 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Get Started?</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Create your first bot to start providing 24/7 customer support
              </p>
              <Button 
                className="bg-[#6566F1] hover:bg-[#5A5BD8] text-white rounded-2xl"
                onClick={() => handleNavigation('/dashboard/bots')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Bot
              </Button>
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
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-48">
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Bot
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <PlayCircle className="w-4 h-4 mr-2" />
                          Test Bot
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Settings className="w-4 h-4 mr-2" />
                          Settings
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Bot
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge className={getStatusColor(bot.status)}>
                      {bot.status}
                    </Badge>
                    <span className="text-sm text-gray-500">{bot.lastActive}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Bot className="w-4 h-4 text-gray-400" />
                      <span>{bot.conversations} chats</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Settings className="w-4 h-4 text-gray-400" />
                      <span>{bot.knowledgeBase} docs</span>
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 border-gray-300 hover:bg-gray-50 text-gray-700 rounded-2xl"
                      onClick={() => handleNavigation('/dashboard/analytics')}
                    >
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Test
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1 bg-[#6566F1] hover:bg-[#5A5BD8] text-white rounded-2xl"
                      onClick={() => handleNavigation('/dashboard/settings')}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Manage
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayoutWithAuth>
  );
};

export default BotsPage;
