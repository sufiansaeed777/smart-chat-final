'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  MessageSquare, Clock, Search, MoreHorizontal, Loader2, SortAsc, SortDesc,
  Bot, Eye, Download, Trash2, Globe, ChevronLeft, ChevronRight, Flag,
  AlertTriangle, CheckCircle, Users, BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import RoleGuard from '@/components/auth/RoleGuard';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ConversationSession {
  id: string;
  sessionId?: string;
  botId: string;
  botName: string;
  botOwner: string;
  botOwnerId?: string;
  userId: string;
  userName: string;
  userEmail: string;
  guestId?: string;
  visitorEmail?: string;
  pageUrl?: string;
  country?: string;
  ipAddress?: string;
  startTime: string;
  endTime: string;
  lastMessageTime: string;
  status: string;
  mode?: string;
  messageCount: number;
  duration: string;
  source: string;
  isFlagged?: boolean;
  flagReason?: string;
  reviewStatus?: string;
  assignedAgent?: {
    id: string;
    name: string;
    email: string;
  };
}

interface ConversationStats {
  total: number;
  active: number;
  waiting: number;
  completed: number;
  flagged: number;
  wordpress: number;
  website: number;
  playground: number;
  totalMessages: number;
  avgMessagesPerConversation: number;
}

interface FilterOptions {
  bots: Array<{ id: string; name: string; owner: string }>;
  managers: Array<{ id: string; name: string; email: string }>;
}

const AdminConversationsPage = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterBot, setFilterBot] = useState('all');
  const [filterManager, setFilterManager] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [sortBy, setSortBy] = useState('lastMessage');
  const [sortOrder, setSortOrder] = useState('desc');
  const [conversations, setConversations] = useState<ConversationSession[]>([]);
  const [stats, setStats] = useState<ConversationStats>({
    total: 0,
    active: 0,
    waiting: 0,
    completed: 0,
    flagged: 0,
    wordpress: 0,
    website: 0,
    playground: 0,
    totalMessages: 0,
    avgMessagesPerConversation: 0
  });
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    bots: [],
    managers: []
  });
  const [loading, setLoading] = useState(true);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedConversations, setSelectedConversations] = useState<string[]>([]);
  const ITEMS_PER_PAGE = 20;

  const handleViewConversation = (conversationId: string) => {
    router.push(`/admin-dashboard/conversations/${conversationId}`);
  };

  const handleExportConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/admin/conversations/${conversationId}`);
      if (response.ok) {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `conversation-${conversationId}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        alert('Failed to export conversation. Please try again.');
      }
    } catch (error) {
      console.error('Error exporting conversation:', error);
      alert('Error exporting conversation. Please try again.');
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (!confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/conversations/${conversationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchConversations();
        alert('Conversation deleted successfully');
      } else {
        alert('Failed to delete conversation. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert('Error deleting conversation. Please try again.');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedConversations.length === 0) {
      alert('Please select conversations to delete');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedConversations.length} conversation(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/conversations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationIds: selectedConversations })
      });

      if (response.ok) {
        setSelectedConversations([]);
        await fetchConversations();
        alert('Conversations deleted successfully');
      } else {
        alert('Failed to delete conversations. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting conversations:', error);
      alert('Error deleting conversations. Please try again.');
    }
  };

  const fetchConversations = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setConversationsLoading(true);
      }

      const params = new URLSearchParams({
        sortBy,
        sortOrder,
        status: filterStatus,
        botId: filterBot,
        managerId: filterManager,
        dateRange: filterDateRange,
        source: filterSource,
        search: searchTerm
      });

      const response = await fetch(`/api/admin/conversations?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }

      const data = await response.json();
      setConversations(data.conversations || []);
      setStats(data.stats || {
        total: 0,
        active: 0,
        waiting: 0,
        completed: 0,
        flagged: 0,
        wordpress: 0,
        website: 0,
        playground: 0,
        totalMessages: 0,
        avgMessagesPerConversation: 0
      });
      setFilterOptions(data.filters || { bots: [], managers: [] });
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch conversations');
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      } else {
        setConversationsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchConversations(true);
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchConversations(false);
    }
  }, [sortBy, sortOrder, filterStatus, filterBot, filterManager, filterDateRange, filterSource]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loading) {
        fetchConversations(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'idle':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleString();
  };

  const formatRelativeTime = (timeString: string) => {
    const now = new Date();
    const time = new Date(timeString);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  // Pagination
  const totalPages = Math.ceil(conversations.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedConversations = conversations.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterBot, filterManager, filterDateRange, filterSource]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const toggleSelectConversation = (id: string) => {
    setSelectedConversations(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedConversations.length === paginatedConversations.length) {
      setSelectedConversations([]);
    } else {
      setSelectedConversations(paginatedConversations.map(c => c.id));
    }
  };

  const SortButton = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
    >
      <span>{children}</span>
      {sortBy === field && (
        sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
      )}
    </Button>
  );

  if (loading) {
    return (
      <RoleGuard allowedRoles={['admin']}>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#6566F1] mx-auto mb-4" />
              <p className="text-gray-600">Loading conversations...</p>
            </div>
          </div>
        </div>
      </RoleGuard>
    );
  }

  if (error) {
    return (
      <RoleGuard allowedRoles={['admin']}>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Conversations</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button
                onClick={() => fetchConversations(true)}
                className="bg-[#6566F1] hover:bg-[#5A5BD8] text-white"
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">All Conversations</h1>
            <p className="text-gray-600 mt-1">
              View and manage all chatbot conversations across the platform
            </p>
          </div>
          {selectedConversations.length > 0 && (
            <Button
              onClick={handleBulkDelete}
              variant="destructive"
              className="flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Selected ({selectedConversations.length})</span>
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <Card className="group relative border border-gray-200 bg-blue-50 hover:shadow-lg transition-all duration-300 rounded-xl">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-lg font-bold text-blue-600">{stats.total}</p>
                  <p className="text-[10px] text-gray-600">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative border border-gray-200 bg-green-50 hover:shadow-lg transition-all duration-300 rounded-xl">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-lg font-bold text-green-600">{stats.active}</p>
                  <p className="text-[10px] text-gray-600">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative border border-gray-200 bg-yellow-50 hover:shadow-lg transition-all duration-300 rounded-xl">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-lg font-bold text-yellow-600">{stats.waiting}</p>
                  <p className="text-[10px] text-gray-600">Waiting</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative border border-gray-200 bg-purple-50 hover:shadow-lg transition-all duration-300 rounded-xl">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-lg font-bold text-purple-600">{stats.completed}</p>
                  <p className="text-[10px] text-gray-600">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative border border-gray-200 bg-red-50 hover:shadow-lg transition-all duration-300 rounded-xl">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                  <Flag className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-lg font-bold text-red-600">{stats.flagged}</p>
                  <p className="text-[10px] text-gray-600">Flagged</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative border border-gray-200 bg-indigo-50 hover:shadow-lg transition-all duration-300 rounded-xl">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                  <Globe className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-lg font-bold text-indigo-600">{stats.wordpress}</p>
                  <p className="text-[10px] text-gray-600">Website</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative border border-gray-200 bg-orange-50 hover:shadow-lg transition-all duration-300 rounded-xl">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-lg font-bold text-orange-600">{stats.totalMessages}</p>
                  <p className="text-[10px] text-gray-600">Messages</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative border border-gray-200 bg-teal-50 hover:shadow-lg transition-all duration-300 rounded-xl">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-lg font-bold text-teal-600">{stats.avgMessagesPerConversation}</p>
                  <p className="text-[10px] text-gray-600">Avg/Conv</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Source Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 p-2 shadow-sm">
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setFilterSource('all')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterSource === 'all'
                  ? 'bg-[#6566F1] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>All Conversations</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                filterSource === 'all' ? 'bg-white/20' : 'bg-gray-200'
              }`}>{stats.total}</span>
            </button>
            <button
              onClick={() => setFilterSource('wordpress')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterSource === 'wordpress'
                  ? 'bg-[#6566F1] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>WordPress</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                filterSource === 'wordpress' ? 'bg-white/20' : 'bg-blue-100 text-blue-700'
              }`}>{stats.wordpress}</span>
            </button>
            <button
              onClick={() => setFilterSource('website')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterSource === 'website'
                  ? 'bg-[#6566F1] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Website Chatbot</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                filterSource === 'website' ? 'bg-white/20' : 'bg-indigo-100 text-indigo-700'
              }`}>{stats.website}</span>
            </button>
            <button
              onClick={() => setFilterSource('playground')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterSource === 'playground'
                  ? 'bg-[#6566F1] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>Test/Playground</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                filterSource === 'playground' ? 'bg-white/20' : 'bg-gray-200'
              }`}>{stats.playground}</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by user, bot, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9 text-sm border-gray-200 focus:border-[#6566F1] focus:ring-[#6566F1] bg-white rounded-lg"
                />
              </div>
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-9 px-3 py-1 text-sm border border-gray-200 rounded-lg focus:border-[#6566F1] focus:ring-[#6566F1] bg-white text-gray-900"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="waiting">Waiting</option>
              <option value="completed">Completed</option>
              <option value="idle">Idle</option>
            </select>

            {/* Bot Filter */}
            <select
              value={filterBot}
              onChange={(e) => setFilterBot(e.target.value)}
              className="h-9 px-3 py-1 text-sm border border-gray-200 rounded-lg focus:border-[#6566F1] focus:ring-[#6566F1] bg-white text-gray-900"
            >
              <option value="all">All Bots</option>
              {filterOptions.bots
                .filter((bot, index, self) => self.findIndex(b => b.id === bot.id) === index)
                .map((bot) => (
                  <option key={bot.id} value={bot.id}>{bot.name}</option>
                ))}
            </select>

            {/* Manager Filter */}
            <select
              value={filterManager}
              onChange={(e) => setFilterManager(e.target.value)}
              className="h-9 px-3 py-1 text-sm border border-gray-200 rounded-lg focus:border-[#6566F1] focus:ring-[#6566F1] bg-white text-gray-900"
            >
              <option value="all">All Managers</option>
              {filterOptions.managers.map((manager) => (
                <option key={manager.id} value={manager.id}>{manager.name}</option>
              ))}
            </select>

            {/* Date Range Filter */}
            <select
              value={filterDateRange}
              onChange={(e) => setFilterDateRange(e.target.value)}
              className="h-9 px-3 py-1 text-sm border border-gray-200 rounded-lg focus:border-[#6566F1] focus:ring-[#6566F1] bg-white text-gray-900"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>

        {/* Conversations List */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-visible">
          {/* Table Header */}
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-700 uppercase tracking-wide items-center">
              <div className="col-span-1 flex items-center">
                <input
                  type="checkbox"
                  checked={selectedConversations.length === paginatedConversations.length && paginatedConversations.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300 text-[#6566F1] focus:ring-[#6566F1]"
                />
              </div>
              <div className="col-span-2">
                <SortButton field="user">Visitor</SortButton>
              </div>
              <div className="col-span-2">
                <SortButton field="bot">Bot</SortButton>
              </div>
              <div className="col-span-2">
                <SortButton field="lastMessage">Last Message</SortButton>
              </div>
              <div className="col-span-1 text-center">Source</div>
              <div className="col-span-1 text-center">Status</div>
              <div className="col-span-1 text-center">
                <SortButton field="messages">Msgs</SortButton>
              </div>
              <div className="col-span-1 text-center">Duration</div>
              <div className="col-span-1 text-center">Actions</div>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-200">
            {conversationsLoading && (
              <div className="p-4 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-[#6566F1] mx-auto" />
              </div>
            )}
            {!conversationsLoading && paginatedConversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-gray-900 mb-2">No conversations found</h3>
                <p className="text-sm text-gray-600">
                  {searchTerm || filterStatus !== 'all' || filterBot !== 'all' || filterManager !== 'all'
                    ? 'Try adjusting your search or filter criteria.'
                    : 'No conversations have been recorded yet.'}
                </p>
              </div>
            ) : (
              !conversationsLoading && paginatedConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${conversation.isFlagged ? 'bg-red-50' : ''}`}
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (!target.closest('[role="menuitem"]') && !target.closest('button') && !target.closest('input[type="checkbox"]')) {
                      handleViewConversation(conversation.id);
                    }
                  }}
                >
                  <div className="grid grid-cols-12 gap-2 items-center">
                    {/* Checkbox */}
                    <div className="col-span-1">
                      <input
                        type="checkbox"
                        checked={selectedConversations.includes(conversation.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleSelectConversation(conversation.id);
                        }}
                        className="rounded border-gray-300 text-[#6566F1] focus:ring-[#6566F1]"
                      />
                    </div>

                    {/* Visitor */}
                    <div className="col-span-2">
                      <div className="flex items-center space-x-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                          conversation.source === 'wordpress' ? 'bg-blue-100' : conversation.source === 'website' ? 'bg-indigo-100' : 'bg-gray-200'
                        }`}>
                          {conversation.source === 'wordpress' ? (
                            <Globe className="w-3.5 h-3.5 text-blue-600" />
                          ) : conversation.source === 'website' ? (
                            <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                          ) : (
                            <span className="text-xs font-medium text-gray-600">
                              {conversation.userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <p className="text-xs font-medium text-gray-900 truncate">{conversation.userName}</p>
                            {conversation.isFlagged && (
                              <AlertTriangle className="w-3 h-3 text-red-500" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate">{conversation.userEmail}</p>
                        </div>
                      </div>
                    </div>

                    {/* Bot */}
                    <div className="col-span-2">
                      <div className="flex items-center space-x-2">
                        <Bot className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-gray-900 truncate">{conversation.botName}</p>
                          <p className="text-xs text-gray-500 truncate">{conversation.botOwner}</p>
                        </div>
                      </div>
                    </div>

                    {/* Last Message */}
                    <div className="col-span-2">
                      <p className="text-xs text-gray-900">{formatRelativeTime(conversation.lastMessageTime)}</p>
                      <p className="text-xs text-gray-500">{formatTime(conversation.lastMessageTime)}</p>
                    </div>

                    {/* Source */}
                    <div className="col-span-1 flex justify-center">
                      <Badge className={`text-[10px] px-1.5 py-0.5 ${
                        conversation.source === 'wordpress'
                          ? 'bg-blue-100 text-blue-700'
                          : conversation.source === 'website'
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {conversation.source === 'wordpress' ? 'WordPress' : conversation.source === 'website' ? 'Website' : 'Test'}
                      </Badge>
                    </div>

                    {/* Status */}
                    <div className="col-span-1 flex justify-center">
                      <Badge className={`text-[10px] px-1.5 py-0.5 ${getStatusColor(conversation.status)}`}>
                        {conversation.status}
                      </Badge>
                    </div>

                    {/* Messages */}
                    <div className="col-span-1 text-center">
                      <span className="text-xs text-gray-900">{conversation.messageCount}</span>
                    </div>

                    {/* Duration */}
                    <div className="col-span-1 text-center">
                      <span className="text-xs text-gray-900">{conversation.duration}</span>
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 flex justify-center">
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="h-6 w-6 p-0 border-gray-200 text-gray-600 hover:bg-gray-50">
                            <MoreHorizontal className="w-3 h-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" side="top" sideOffset={5}>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewConversation(conversation.id);
                            }}
                            className="cursor-pointer"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExportConversation(conversation.id);
                            }}
                            className="cursor-pointer"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Export Chat
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteConversation(conversation.id);
                            }}
                            className="cursor-pointer text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {conversations.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1} to {Math.min(endIndex, conversations.length)} of {conversations.length} conversations
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="h-8 px-3 text-sm border-gray-200 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
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
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`h-8 w-8 p-0 text-sm ${
                          currentPage === pageNum
                            ? 'bg-[#6566F1] hover:bg-[#5A5BD8] text-white'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="h-8 px-3 text-sm border-gray-200 disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  );
};

export default AdminConversationsPage;
