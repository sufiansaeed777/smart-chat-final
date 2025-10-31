'use client';

import React, { useState, useEffect } from 'react';
import {
  Bot, 
  Search,
  Filter,
  Plus,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Play,
  Pause,
  Settings,
  MessageSquare,
  Users,
  Activity,
  Calendar,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Upload
} from 'lucide-react';

interface BotData {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'maintenance';
  category: string;
  conversations: number;
  users: number;
  lastActive: string;
  createdAt: string;
  createdBy?: string;
  avatar?: string;
}

const BotsPage: React.FC = () => {
  const [bots, setBots] = useState<BotData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedBots, setSelectedBots] = useState<string[]>([]);

  useEffect(() => {
    const loadBots = async () => {
      try {
        const response = await fetch('/api/admin/bots');

        if (!response.ok) {
          console.error('Failed to fetch bots:', response.statusText);
          setBots([]);
          return;
        }

        const data = await response.json();
        setBots(data.bots || []);
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
                         bot.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || bot.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || bot.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'inactive': return <XCircle className="w-4 h-4" />;
      case 'maintenance': return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const handleSelectBot = (botId: string) => {
    setSelectedBots(prev => 
      prev.includes(botId) 
        ? prev.filter(id => id !== botId)
        : [...prev, botId]
    );
  };

  const handleSelectAll = () => {
    if (selectedBots.length === filteredBots.length) {
      setSelectedBots([]);
    } else {
      setSelectedBots(filteredBots.map(bot => bot.id));
    }
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
          <h1 className="text-3xl font-bold text-gray-900">All Bots</h1>
          <p className="text-gray-600 mt-2">Manage and monitor all AI chatbots in the system</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 bg-white text-gray-700 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
            <Download className="w-5 h-5" />
            <span>Export</span>
          </button>
          <button className="flex items-center space-x-2 bg-[#6566F1] text-white px-4 py-2 rounded-xl hover:bg-[#5A5BD9] transition-colors shadow-lg">
            <Plus className="w-5 h-5" />
            <span>Create Bot</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border-0 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Bots</p>
              <p className="text-3xl font-bold text-gray-900">{bots.length}</p>
              <p className="text-sm text-blue-600 flex items-center mt-1">
                <TrendingUp className="w-4 h-4 mr-1" />
                +8% this month
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <Bot className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border-0 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Bots</p>
              <p className="text-3xl font-bold text-gray-900">{bots.filter(b => b.status === 'active').length}</p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <CheckCircle className="w-4 h-4 mr-1" />
                {Math.round((bots.filter(b => b.status === 'active').length / bots.length) * 100)}% of total
              </p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border-0 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Conversations</p>
              <p className="text-3xl font-bold text-gray-900">{bots.reduce((sum, bot) => sum + bot.conversations, 0).toLocaleString()}</p>
              <p className="text-sm text-purple-600 flex items-center mt-1">
                <MessageSquare className="w-4 h-4 mr-1" />
                +15% this month
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border-0 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
          <div className="flex items-center justify-between">
          <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">{bots.reduce((sum, bot) => sum + bot.users, 0).toLocaleString()}</p>
              <p className="text-sm text-orange-600 flex items-center mt-1">
                <Users className="w-4 h-4 mr-1" />
                +12% this month
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
        </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border-0">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search bots by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6566F1] focus:border-transparent bg-gray-50"
            />
            </div>
          </div>
          <div className="flex gap-3">
          <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6566F1] focus:border-transparent bg-gray-50"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6566F1] focus:border-transparent bg-gray-50"
            >
              <option value="all">All Categories</option>
              <option value="Support">Support</option>
              <option value="Sales">Sales</option>
              <option value="Technical">Technical</option>
              <option value="General">General</option>
              <option value="Marketing">Marketing</option>
          </select>
          </div>
        </div>
      </div>

        {/* Bots Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBots.map((bot) => (
          <div key={bot.id} className="bg-white rounded-2xl shadow-sm border-0 overflow-hidden hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#6566F1] to-[#7F82F3] rounded-xl flex items-center justify-center shadow-lg">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{bot.name}</h3>
                    <p className="text-sm text-gray-500">{bot.category}</p>
                  </div>
                    </div>
                    <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedBots.includes(bot.id)}
                    onChange={() => handleSelectBot(bot.id)}
                    className="w-4 h-4 text-[#6566F1] bg-gray-100 border-gray-300 rounded focus:ring-[#6566F1] focus:ring-2"
                  />
                  <button className="text-gray-500 hover:text-gray-700">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-4">{bot.description}</p>

              {/* Status */}
              <div className="flex items-center mb-4">
                <span className={`px-3 py-1 text-xs font-semibold rounded-full border flex items-center w-fit ${getStatusBadgeColor(bot.status)}`}>
                  {getStatusIcon(bot.status)}
                  <span className="ml-1">{bot.status.charAt(0).toUpperCase() + bot.status.slice(1)}</span>
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <MessageSquare className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-gray-900">{bot.conversations.toLocaleString()}</p>
                  <p className="text-xs text-gray-600">Conversations</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <Users className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-gray-900">{bot.users.toLocaleString()}</p>
                  <p className="text-xs text-gray-600">Users</p>
                </div>
              </div>

              {/* Last Active */}
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>Created {new Date(bot.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center">
                  <Activity className="w-4 h-4 mr-1" />
                  <span>Active {bot.lastActive}</span>
                    </div>
                  </div>

              {/* Actions */}
              <div className="flex items-center space-x-2">
                <button className="flex-1 flex items-center justify-center space-x-2 bg-[#6566F1] text-white px-4 py-2 rounded-xl hover:bg-[#5A5BD9] transition-colors">
                  <Eye className="w-4 h-4" />
                  <span>View</span>
                </button>
                <button className="flex items-center justify-center p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
                <button className="flex items-center justify-center p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors">
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
                  </div>
        ))}
      </div>

      {filteredBots.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl shadow-sm border-0">
          <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No bots found</h3>
          <p className="text-gray-600 mb-6">Try adjusting your search or filter criteria.</p>
          <button className="bg-[#6566F1] text-white px-6 py-3 rounded-xl hover:bg-[#5A5BD9] transition-colors">
            Create New Bot
          </button>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedBots.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-xl shadow-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">
              {selectedBots.length} bot{selectedBots.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors">
                <Play className="w-4 h-4 inline mr-1" />
                Activate
              </button>
              <button className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors">
                <Pause className="w-4 h-4 inline mr-1" />
                Pause
              </button>
              <button className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">
                <Trash2 className="w-4 h-4 inline mr-1" />
                Delete
              </button>
            </div>
          </div>
          </div>
        )}
      </div>
  );
};

export default BotsPage;
