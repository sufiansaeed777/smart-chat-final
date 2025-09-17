'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Bot, 
  MessageSquare, 
  Users, 
  Clock,
  PlayCircle,
  Settings,
  MoreHorizontal,
  Search,
  Filter,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

interface AssignedBot {
  id: string;
  name: string;
  description: string;
  domain: string;
  status: 'active' | 'paused' | 'inactive';
  conversations: number;
  lastActive: string;
  assignedBy: string;
  assignedAt: string;
}

const UserBots = () => {
  const { data: session } = useSession();
  const [bots, setBots] = useState<AssignedBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Mock data for assigned bots
  const mockAssignedBots: AssignedBot[] = [
    {
      id: '1',
      name: 'Customer Support Bot',
      description: 'Handles customer inquiries and support tickets',
      domain: 'support.company.com',
      status: 'active',
      conversations: 342,
      lastActive: '2 min ago',
      assignedBy: 'John Manager',
      assignedAt: '2024-01-15'
    },
    {
      id: '2',
      name: 'Sales Assistant',
      description: 'Helps with product information and sales inquiries',
      domain: 'sales.company.com',
      status: 'active',
      conversations: 189,
      lastActive: '1 hour ago',
      assignedBy: 'Sarah Manager',
      assignedAt: '2024-01-10'
    },
    {
      id: '3',
      name: 'FAQ Helper',
      description: 'Answers frequently asked questions',
      domain: 'help.company.com',
      status: 'paused',
      conversations: 87,
      lastActive: '3 days ago',
      assignedBy: 'Mike Manager',
      assignedAt: '2024-01-05'
    }
  ];

  useEffect(() => {
    // Fetch assigned bots from API
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
        setError('Failed to load assigned bots. Please try again.');
        // Fallback to mock data if API fails
        setBots(mockAssignedBots);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.email) {
      fetchAssignedBots();
    }
  }, [session?.user?.email]);

  const filteredBots = bots.filter(bot => {
    const matchesSearch = bot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bot.domain.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || bot.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

   const getStatusColor = (status: string) => {
     switch (status) {
       case 'active':
         return 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200 hover:text-emerald-900 hover:border-emerald-300';
       case 'paused':
         return 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200 hover:text-amber-900 hover:border-amber-300';
       case 'inactive':
         return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 hover:text-gray-900 hover:border-gray-300';
       default:
         return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 hover:text-gray-900 hover:border-gray-300';
     }
   };

  const handleBotAction = (botId: string, action: string) => {
    console.log(`Performing ${action} on bot ${botId}`);
    // In a real app, this would make an API call
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6566F1] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your assigned bots...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bot className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-red-600 mb-2">Error Loading Bots</p>
            <p className="text-gray-600 text-sm">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-[#6566F1] text-white rounded-lg hover:bg-[#5A5BD9] transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#6566F1] to-[#5A5BD9] rounded-xl flex items-center justify-center shadow-lg">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Assigned Bots</h1>
              <p className="text-sm text-gray-600 mt-1">Bots assigned to you by your manager</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search bots by name or domain..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-gray-300 focus:border-[#6566F1] focus:ring-[#6566F1] rounded-xl h-11"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-xl focus:border-[#6566F1] focus:ring-[#6566F1] bg-white h-11"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        
        {/* Quick Stats */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Assigned Bots</p>
                <p className="text-lg font-bold text-blue-700">{filteredBots.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Total Conversations</p>
                <p className="text-lg font-bold text-green-700">{filteredBots.reduce((sum, bot) => sum + bot.conversations, 0)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Active Bots</p>
                <p className="text-lg font-bold text-purple-700">{filteredBots.filter(bot => bot.status === 'active').length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bots Grid */}
      {filteredBots.length === 0 ? (
        <Card className="border border-gray-200 bg-white">
          <CardContent className="p-12 text-center">
            <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No bots assigned</h3>
            <p className="text-gray-600 mb-4">
              {session?.user?.name ? `${session.user.name}, you don&apos;t have any bots assigned to you yet.` : "You don&apos;t have any bots assigned to you yet."} Contact your manager to get access to bots.
            </p>
          </CardContent>
        </Card>
      ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
          {filteredBots.map((bot) => (
            <Card key={bot.id} className="group relative bg-white/80 backdrop-blur-sm border border-gray-200/50 hover:border-[#6566F1]/30 hover:shadow-2xl hover:shadow-[#6566F1]/20 transition-all duration-500 rounded-3xl overflow-hidden hover:-translate-y-2 z-10">
              {/* Modern Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#6566F1]/8 via-transparent to-[#5A5BD9]/5 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
              

              <CardHeader className="pb-3 relative z-10">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#6566F1] to-[#5A5BD9] rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-[#6566F1]/25 transition-shadow duration-300">
                        <Bot className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-lg font-semibold truncate group-hover:text-[#6566F1] transition-colors duration-200">{bot.name}</CardTitle>
                      <p className="text-sm text-gray-500 truncate">{bot.domain}</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3 relative z-10">
                {/* Status and Last Active */}
                <div className="flex items-center justify-between">
                  <Badge className={`${getStatusColor(bot.status)} font-medium px-3 py-1`}>
                    {bot.status}
                  </Badge>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{bot.lastActive}</span>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 via-blue-100/30 to-indigo-50 rounded-2xl p-4 border border-blue-200/40 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 text-center group">
                    <div className="flex items-center justify-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <MessageSquare className="w-5 h-5 text-white" />
                      </div>
                      <p className="text-sm font-bold text-blue-800">Chats</p>
                    </div>
                    <p className="text-3xl font-black text-blue-900 group-hover:text-blue-700 transition-colors duration-300">{bot.conversations}</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-amber-50 via-yellow-100/30 to-orange-50 rounded-2xl p-4 border border-amber-200/40 hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300 text-center group">
                    <div className="flex items-center justify-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <Star className="w-5 h-5 text-white" />
                      </div>
                      <p className="text-sm font-bold text-amber-800">Rating</p>
                    </div>
                    <p className="text-3xl font-black text-amber-900 group-hover:text-amber-700 transition-colors duration-300">{(4.5 + Math.random() * 0.5).toFixed(1)}</p>
                  </div>
                </div>

                {/* Description */}
                <div className="pt-2">
                  <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{bot.description}</p>
                </div>

                {/* Assignment Info */}
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Assigned by: {bot.assignedBy}</span>
                    <span>Assigned: {new Date(bot.assignedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2 pt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 border-gray-300 hover:bg-[#6566F1]/10 hover:border-[#6566F1] hover:text-[#6566F1] text-gray-700 rounded-xl transition-all duration-200 group/btn"
                    onClick={() => handleBotAction(bot.id, 'view')}
                  >
                    <MessageSquare className="w-4 h-4 mr-2 group-hover/btn:animate-pulse" />
                    View Chat
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1 bg-gradient-to-r from-[#6566F1] to-[#5A5BD9] hover:from-[#5A5BD9] hover:to-[#4A4BC8] text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-[#6566F1]/25 group/btn"
                    onClick={() => handleBotAction(bot.id, 'test')}
                  >
                    <PlayCircle className="w-4 h-4 mr-2 group-hover/btn:animate-pulse" />
                    Test Bot
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

export default UserBots;
