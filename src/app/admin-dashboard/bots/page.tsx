'use client';

import React, { useState, useEffect } from 'react';
import {
  Bot,
  Search,
  Filter,
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
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown
} from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';

interface BotData {
  id: string;
  name: string;
  description: string;
  domain: string;
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedBotForEdit, setSelectedBotForEdit] = useState<BotData | null>(null);
  const [selectedBotForView, setSelectedBotForView] = useState<BotData | null>(null);
  const [botToDelete, setBotToDelete] = useState<{ id: string; name: string } | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newDomain, setNewDomain] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('');
  const [updating, setUpdating] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // Handle Escape key to close modals
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showEditModal) {
          setShowEditModal(false);
          setSelectedBotForEdit(null);
          setNewStatus('');
          setNewName('');
          setNewDescription('');
          setNewDomain('');
          setNewCategory('');
        }
        if (showDeleteModal) {
          setShowDeleteModal(false);
          setBotToDelete(null);
        }
        if (showViewModal) {
          setShowViewModal(false);
          setSelectedBotForView(null);
        }
      }
    };

    if (showEditModal || showDeleteModal || showViewModal) {
      window.addEventListener('keydown', handleEscape);
      return () => {
        window.removeEventListener('keydown', handleEscape);
      };
    }
  }, [showEditModal, showDeleteModal, showViewModal]);

  // Fetch bots function
  const loadBots = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) setLoading(true);
      const response = await fetch('/api/admin/bots');

      if (!response.ok) {
        console.error('Failed to fetch bots');
        if (isInitialLoad) setLoading(false);
        return;
      }

      const data = await response.json();
      setBots(data.bots || []);
    } catch (error) {
      console.error('Error loading bots:', error);
    } finally {
      if (isInitialLoad) setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadBots(true);
  }, []);

  // Auto-refresh every 30 seconds for live updates
  useEffect(() => {
    const interval = setInterval(() => {
      loadBots(false);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  const filteredBots = bots.filter(bot => {
    const matchesSearch = bot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bot.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || bot.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || bot.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredBots.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedBots = filteredBots.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, categoryFilter]);

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

  const handleDeleteBot = (bot: BotData) => {
    setBotToDelete({
      id: bot.id,
      name: bot.name
    });
    setShowDeleteModal(true);
  };

  const confirmDeleteBot = async () => {
    if (!botToDelete) return;

    try {
      const response = await fetch('/api/admin/bots', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botId: botToDelete.id })
      });

      if (response.ok) {
        setBots(prev => prev.filter(b => b.id !== botToDelete.id));
        setShowDeleteModal(false);
        setBotToDelete(null);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete bot');
      }
    } catch (error: any) {
      console.error('Error deleting bot:', error);
      alert(error.message || 'Failed to delete bot. Please try again.');
    }
  };

  const handleViewBot = (bot: BotData) => {
    setSelectedBotForView(bot);
    setShowViewModal(true);
  };

  const handleEditBot = (bot: BotData) => {
    setSelectedBotForEdit(bot);
    setNewStatus(bot.status);
    setNewName(bot.name);
    setNewDescription(bot.description);
    setNewDomain(bot.domain);
    setNewCategory(bot.category);
    setShowEditModal(true);
  };

  const confirmUpdateBotStatus = async () => {
    if (!selectedBotForEdit || !newStatus || !newName || !newCategory || !newDomain) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate domain format
    if (!newDomain.startsWith('https://')) {
      alert('Domain must start with https:// (e.g., https://yoursite.com)');
      return;
    }

    try {
      new URL(newDomain);
    } catch (error) {
      alert('Please enter a valid URL (e.g., https://yoursite.com)');
      return;
    }

    if (!['active', 'inactive', 'maintenance'].includes(newStatus)) {
      alert('Invalid status! Must be: active, inactive, or maintenance');
      return;
    }

    setUpdating(true);
    try {
      const updates = {
        status: newStatus,
        name: newName,
        description: newDescription,
        domain: newDomain,
        category: newCategory
      };

      const response = await fetch('/api/admin/bots', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botId: selectedBotForEdit.id, updates })
      });

      if (response.ok) {
        setBots(prev => prev.map(b => b.id === selectedBotForEdit.id ? {
          ...b,
          status: newStatus as 'active' | 'inactive' | 'maintenance',
          name: newName,
          description: newDescription,
          domain: newDomain,
          category: newCategory
        } : b));
        setShowEditModal(false);
        setSelectedBotForEdit(null);
        setNewStatus('');
        setNewName('');
        setNewDescription('');
        setNewDomain('');
        setNewCategory('');
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update bot');
      }
    } catch (error: any) {
      console.error('Error updating bot:', error);
      alert(error.message || 'Failed to update bot. Please try again.');
    } finally {
      setUpdating(false);
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
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6566F1] focus:border-transparent bg-gray-50 text-gray-900 placeholder:text-gray-500"
            />
            </div>
          </div>
          <div className="flex gap-3">
          <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6566F1] focus:border-transparent bg-gray-50 text-gray-900"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6566F1] focus:border-transparent bg-gray-50 text-gray-900"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {paginatedBots.map((bot) => (
          <div key={bot.id} className="bg-white rounded-2xl shadow-sm border-0 overflow-hidden hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer flex flex-col h-full max-w-md w-full mx-auto">
            <div className="p-6 flex flex-col flex-1">
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
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-4 line-clamp-4">{bot.description}</p>

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
                <button
                  onClick={() => handleViewBot(bot)}
                  className="flex-1 flex items-center justify-center space-x-2 bg-[#6566F1] text-white px-4 py-2 rounded-xl hover:bg-[#5A5BD9] transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span>View</span>
                </button>
                <Tooltip content="Edit bot" position="top">
                <button
                    onClick={() => handleEditBot(bot)}
                  className="flex items-center justify-center p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                </Tooltip>
                <Tooltip content="Delete bot" position="top">
                <button
                    onClick={() => handleDeleteBot(bot)}
                  className="flex items-center justify-center p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                </Tooltip>
              </div>
            </div>
                  </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {filteredBots.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border-0 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredBots.length)} of {filteredBots.length} bots
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="First page"
              >
                <ChevronsUpDown className="w-4 h-4 text-gray-600 rotate-90" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Previous page"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === pageNum
                          ? 'bg-[#6566F1] text-white'
                          : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Next page"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Last page"
              >
                <ChevronsUpDown className="w-4 h-4 text-gray-600 -rotate-90" />
              </button>
            </div>
          </div>
        </div>
      )}

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
              {/* Determine the status of selected bots */}
              {(() => {
                const selectedBotsData = bots.filter(bot => selectedBots.includes(bot.id));
                const allActive = selectedBotsData.every(bot => bot.status === 'active');
                const allInactive = selectedBotsData.every(bot => bot.status === 'inactive' || bot.status === 'maintenance');

                return (
                  <>
                {/* Show Activate button only if all selected bots are inactive/maintenance */}
                {allInactive && (
                  <button
                    onClick={async () => {
                      if (confirm(`Activate ${selectedBots.length} bot(s)?`)) {
                        for (const botId of selectedBots) {
                          try {
                            const response = await fetch('/api/admin/bots', {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ botId, updates: { status: 'active' } })
                            });
                            if (response.ok) {
                              setBots(prev => prev.map(b => b.id === botId ? { ...b, status: 'active' } : b));
                            }
                          } catch (error) {
                            console.error('Error activating bot:', error);
                          }
                        }
                        setSelectedBots([]);
                      }
                    }}
                    className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    <Play className="w-4 h-4 inline mr-1" />
                    Activate
                  </button>
                )}

                {/* Show Pause button only if all selected bots are active */}
                {allActive && (
                  <button
                    onClick={async () => {
                      if (confirm(`Pause ${selectedBots.length} bot(s)?`)) {
                        for (const botId of selectedBots) {
                          try {
                            const response = await fetch('/api/admin/bots', {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ botId, updates: { status: 'inactive' } })
                            });
                            if (response.ok) {
                              setBots(prev => prev.map(b => b.id === botId ? { ...b, status: 'inactive' } : b));
                            }
                          } catch (error) {
                            console.error('Error pausing bot:', error);
                          }
                        }
                        setSelectedBots([]);
                      }
                    }}
                    className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
                  >
                    <Pause className="w-4 h-4 inline mr-1" />
                    Pause
                  </button>
                )}

                {/* Show both buttons if mixed statuses - activate only inactive ones, pause only active ones */}
                {!allActive && !allInactive && (
                  <>
                    <button
                      onClick={async () => {
                        const inactiveBots = selectedBotsData.filter(b => b.status === 'inactive' || b.status === 'maintenance');
                        if (inactiveBots.length > 0 && confirm(`Activate ${inactiveBots.length} inactive bot(s)?`)) {
                          for (const bot of inactiveBots) {
                            try {
                              const response = await fetch('/api/admin/bots', {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ botId: bot.id, updates: { status: 'active' } })
                              });
                              if (response.ok) {
                                setBots(prev => prev.map(b => b.id === bot.id ? { ...b, status: 'active' } : b));
                              }
                            } catch (error) {
                              console.error('Error activating bot:', error);
                            }
                          }
                          setSelectedBots([]);
                        }
                      }}
                      className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                    >
                      <Play className="w-4 h-4 inline mr-1" />
                      Activate ({selectedBotsData.filter(b => b.status === 'inactive' || b.status === 'maintenance').length})
                    </button>
                    <button
                      onClick={async () => {
                        const activeBots = selectedBotsData.filter(b => b.status === 'active');
                        if (activeBots.length > 0 && confirm(`Pause ${activeBots.length} active bot(s)?`)) {
                          for (const bot of activeBots) {
                            try {
                              const response = await fetch('/api/admin/bots', {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ botId: bot.id, updates: { status: 'inactive' } })
                              });
                              if (response.ok) {
                                setBots(prev => prev.map(b => b.id === bot.id ? { ...b, status: 'inactive' } : b));
                              }
                            } catch (error) {
                              console.error('Error pausing bot:', error);
                            }
                          }
                          setSelectedBots([]);
                        }
                      }}
                      className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
                    >
                      <Pause className="w-4 h-4 inline mr-1" />
                      Pause ({selectedBotsData.filter(b => b.status === 'active').length})
                    </button>
                  </>
                )}
                <button
                onClick={async () => {
                  if (confirm(`Delete ${selectedBots.length} bot(s)?\n\nThis action cannot be undone.`)) {
                    for (const botId of selectedBots) {
                      const bot = bots.find(b => b.id === botId);
                      if (bot) {
                        try {
                          const response = await fetch('/api/admin/bots', {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ botId })
                          });
                          if (response.ok) {
                            setBots(prev => prev.filter(b => b.id !== botId));
                          }
                        } catch (error) {
                          console.error('Error deleting bot:', error);
                        }
                      }
                    }
                    setSelectedBots([]);
                  }
                }}
                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                <Trash2 className="w-4 h-4 inline mr-1" />
                Delete
              </button>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Edit Bot Modal */}
      {showEditModal && selectedBotForEdit && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900">Edit Bot</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedBotForEdit(null);
                  setNewStatus('');
                  setNewName('');
                  setNewDescription('');
                  setNewDomain('');
                  setNewCategory('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3 pb-4 border-b border-gray-200">
                <div className="w-12 h-12 bg-gradient-to-br from-[#6566F1] to-[#7F82F3] rounded-xl flex items-center justify-center shadow-lg">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{selectedBotForEdit.name}</h3>
                  <p className="text-sm text-gray-600 mt-0.5">{selectedBotForEdit.category}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Bot Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-4 py-3 text-sm text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#6566F1] focus:border-transparent bg-white"
                    placeholder="Enter bot name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full px-4 py-3 text-sm text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#6566F1] focus:border-transparent bg-white resize-none"
                    rows={3}
                    placeholder="Enter bot description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Domain <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    className="w-full px-4 py-3 text-sm text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#6566F1] focus:border-transparent bg-white"
                    placeholder="https://yoursite.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">Must be a valid HTTPS URL</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-4 py-3 text-sm text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#6566F1] focus:border-transparent bg-white"
                    placeholder="e.g., Customer Support, Sales, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-4 py-3 text-sm text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#6566F1] focus:border-transparent bg-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-4 mt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedBotForEdit(null);
                  setNewStatus('');
                  setNewName('');
                  setNewDescription('');
                  setNewDomain('');
                  setNewCategory('');
                }}
                className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                disabled={updating}
              >
                Cancel
              </button>
              <button
                onClick={confirmUpdateBotStatus}
                disabled={updating}
                className="px-4 py-2 text-sm bg-[#6566F1] text-white rounded-xl hover:bg-[#5A5BD9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? 'Updating...' : 'Update Bot'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Bot Modal */}
      {showDeleteModal && botToDelete && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900">Delete Bot</h2>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setBotToDelete(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3 pb-4 border-b border-gray-200">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">Are you sure you want to delete this bot?</p>
                  <p className="text-xs text-gray-600 mt-0.5">This action cannot be undone.</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">Bot Name:</span>
                    <span className="ml-2 text-gray-900">{botToDelete.name}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  This will permanently remove the bot and all its data from the system.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-4 mt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setBotToDelete(null);
                }}
                className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteBot}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
              >
                Delete Bot
              </button>
            </div>
          </div>
          </div>
        )}

      {/* View Bot Modal */}
      {showViewModal && selectedBotForView && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Bot Details</h2>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedBotForView(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Bot Header */}
            <div className="flex items-center space-x-4 pb-6 border-b border-gray-200">
              <div className="w-16 h-16 bg-gradient-to-br from-[#6566F1] to-[#7F82F3] rounded-2xl flex items-center justify-center shadow-lg">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900">{selectedBotForView.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{selectedBotForView.category}</p>
              </div>
              <span className={`px-4 py-2 text-sm font-semibold rounded-full border flex items-center ${getStatusBadgeColor(selectedBotForView.status)}`}>
                {getStatusIcon(selectedBotForView.status)}
                <span className="ml-2">{selectedBotForView.status.charAt(0).toUpperCase() + selectedBotForView.status.slice(1)}</span>
              </span>
            </div>

            {/* Bot Stats */}
            <div className="grid grid-cols-2 gap-4 py-6 border-b border-gray-200">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-700">Conversations</p>
                    <p className="text-3xl font-bold text-purple-900 mt-1">{selectedBotForView.conversations.toLocaleString()}</p>
                  </div>
                  <MessageSquare className="w-10 h-10 text-purple-600 opacity-50" />
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700">Users</p>
                    <p className="text-3xl font-bold text-blue-900 mt-1">{selectedBotForView.users.toLocaleString()}</p>
                  </div>
                  <Users className="w-10 h-10 text-blue-600 opacity-50" />
                </div>
              </div>
            </div>

            {/* Bot Details */}
            <div className="space-y-4 py-6 border-b border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900">Bot Information</h4>

              <div className="space-y-3">
                <div className="flex items-start">
                  <span className="text-sm font-semibold text-gray-600 w-32">Bot ID:</span>
                  <span className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">{selectedBotForView.id}</span>
                </div>

                <div className="flex items-start">
                  <span className="text-sm font-semibold text-gray-600 w-32">Description:</span>
                  <span className="text-sm text-gray-900 flex-1">{selectedBotForView.description || 'No description provided'}</span>
                </div>

                <div className="flex items-start">
                  <span className="text-sm font-semibold text-gray-600 w-32">Domain:</span>
                  <a
                    href={selectedBotForView.domain}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#6566F1] hover:underline flex items-center"
                  >
                    {selectedBotForView.domain}
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>

                <div className="flex items-start">
                  <span className="text-sm font-semibold text-gray-600 w-32">Category:</span>
                  <span className="text-sm text-gray-900">{selectedBotForView.category}</span>
                </div>

                {selectedBotForView.createdBy && (
                  <div className="flex items-start">
                    <span className="text-sm font-semibold text-gray-600 w-32">Created By:</span>
                    <span className="text-sm text-gray-900">{selectedBotForView.createdBy}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Activity Information */}
            <div className="space-y-4 py-6">
              <h4 className="text-lg font-semibold text-gray-900">Activity</h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="flex items-center text-gray-600 mb-2">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium">Created</span>
                  </div>
                  <p className="text-sm text-gray-900 font-semibold">
                    {new Date(selectedBotForView.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {new Date(selectedBotForView.createdAt).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="flex items-center text-gray-600 mb-2">
                    <Activity className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium">Last Active</span>
                  </div>
                  <p className="text-sm text-gray-900 font-semibold">{selectedBotForView.lastActive}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedBotForView(null);
                  handleEditBot(selectedBotForView);
                }}
                className="px-6 py-2.5 text-sm bg-[#6566F1] text-white rounded-xl hover:bg-[#5A5BD9] transition-colors flex items-center"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Bot
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedBotForView(null);
                }}
                className="px-6 py-2.5 text-sm border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
  );
};

export default BotsPage;
