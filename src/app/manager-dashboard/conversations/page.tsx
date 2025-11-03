'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, Clock, User, Search, Filter, MoreHorizontal, Loader2, SortAsc, SortDesc, Calendar, Bot, Users, Eye, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  botId: string;
  botName: string;
  userId: string;
  userName: string;
  userEmail: string;
  startTime: string;
  endTime: string;
  lastMessageTime: string;
  status: string;
  messageCount: number;
  duration: string;
  satisfaction: number;
}

interface ConversationStats {
  total: number;
  active: number;
  completed: number;
  avgResponseTime: string;
}

interface FilterOptions {
  bots: Array<{ id: string; name: string }>;
  users: Array<{ id: string; name: string; email: string }>;
}

const ManagerConversationsPage = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterBot, setFilterBot] = useState('all');
  const [filterUser, setFilterUser] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState('all');
  const [sortBy, setSortBy] = useState('lastMessage');
  const [sortOrder, setSortOrder] = useState('desc');
  const [conversations, setConversations] = useState<ConversationSession[]>([]);
  const [stats, setStats] = useState<ConversationStats>({
    total: 0,
    active: 0,
    completed: 0,
    avgResponseTime: '0 min'
  });
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    bots: [],
    users: []
  });
  const [loading, setLoading] = useState(true);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle conversation actions
  const handleViewConversation = (conversationId: string) => {
    // Navigate to conversation details page in same tab
    console.log('View conversation:', conversationId);
    router.push(`/manager-dashboard/conversations/${conversationId}`);
  };

  const handleExportConversation = async (conversationId: string) => {
    try {
      console.log('Exporting conversation:', conversationId);
      const response = await fetch(`/api/manager/conversations/${conversationId}/export`);
      if (response.ok) {
        const data = await response.json();
        // Create and download JSON file
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
        console.error('Failed to export conversation');
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
      console.log('Deleting conversation:', conversationId);
      const response = await fetch(`/api/manager/conversations/${conversationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh the conversations list
        await fetchConversations();
        alert('Conversation deleted successfully');
      } else {
        console.error('Failed to delete conversation');
        alert('Failed to delete conversation. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert('Error deleting conversation. Please try again.');
    }
  };

  // Fetch conversations from API
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
        userId: filterUser,
        dateRange: filterDateRange
      });
      
      const response = await fetch(`/api/manager/conversations?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }
      
      const data = await response.json();
      setConversations(data.conversations || []);
      setStats(data.stats || { total: 0, active: 0, completed: 0, avgResponseTime: '0 min' });
      setFilterOptions(data.filters || { bots: [], users: [] });
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

  // Initial load
  useEffect(() => {
    fetchConversations(true);
  }, []);

  // Filter changes
  useEffect(() => {
    if (!loading) { // Only fetch when not in initial loading state
      fetchConversations(false);
    }
  }, [sortBy, sortOrder, filterStatus, filterBot, filterUser, filterDateRange]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
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

  const filteredConversations = conversations.filter(conversation => {
    const matchesSearch = conversation.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conversation.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conversation.botName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
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
      <RoleGuard allowedRoles={['manager']}>
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
      <RoleGuard allowedRoles={['manager']}>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Conversations</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button 
                onClick={() => fetchConversations()}
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
    <RoleGuard allowedRoles={['manager']}>
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Conversations</h1>
            <p className="text-gray-600 mt-1">
              Monitor and manage all conversations from your team&apos;s assigned bots
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="group relative border border-gray-200 bg-blue-50 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 rounded-2xl overflow-visible hover:-translate-y-1 z-10">
            {/* Gradient Background Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <CardContent className="p-4 relative z-10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xl font-bold text-blue-600">{stats.total}</p>
                  <p className="text-xs text-gray-600">Total Conversations</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="group relative border border-gray-200 bg-green-50 hover:shadow-xl hover:shadow-green-500/10 transition-all duration-300 rounded-2xl overflow-visible hover:-translate-y-1 z-10">
            {/* Gradient Background Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <CardContent className="p-4 relative z-10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xl font-bold text-green-600">{stats.active}</p>
                  <p className="text-xs text-gray-600">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="group relative border border-gray-200 bg-purple-50 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 rounded-2xl overflow-visible hover:-translate-y-1 z-10">
            {/* Gradient Background Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <CardContent className="p-4 relative z-10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xl font-bold text-purple-600">{stats.completed}</p>
                  <p className="text-xs text-gray-600">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="group relative border border-gray-200 bg-orange-50 hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300 rounded-2xl overflow-visible hover:-translate-y-1 z-10">
            {/* Gradient Background Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <CardContent className="p-4 relative z-10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <span className="text-white text-lg">⚡</span>
                </div>
                <div>
                  <p className="text-xl font-bold text-orange-600">{stats.avgResponseTime}</p>
                  <p className="text-xs text-gray-600">Avg Response</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search conversations..."
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
              <option value="completed">Completed</option>
            </select>

            {/* Bot Filter */}
            <select
              value={filterBot}
              onChange={(e) => setFilterBot(e.target.value)}
              className="h-9 px-3 py-1 text-sm border border-gray-200 rounded-lg focus:border-[#6566F1] focus:ring-[#6566F1] bg-white text-gray-900"
            >
              <option value="all">All Bots</option>
              {filterOptions.bots
                .filter((bot, index, self) => self.findIndex(b => b.id === bot.id) === index) // Remove duplicates
                .map((bot) => (
                  <option key={bot.id} value={bot.id}>{bot.name}</option>
                ))}
            </select>

            {/* User Filter */}
            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="h-9 px-3 py-1 text-sm border border-gray-200 rounded-lg focus:border-[#6566F1] focus:ring-[#6566F1] bg-white text-gray-900"
            >
              <option value="all">All Users</option>
              {filterOptions.users
                .filter((user, index, self) => self.findIndex(u => u.id === user.id) === index) // Remove duplicates
                .map((user) => (
                  <option key={user.id} value={user.id}>{user.name}</option>
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
            <div className="grid grid-cols-12 gap-3 text-xs font-semibold text-gray-700 uppercase tracking-wide">
              <div className="col-span-3">
                <SortButton field="user">User</SortButton>
              </div>
              <div className="col-span-2">
                <SortButton field="bot">Bot</SortButton>
              </div>
              <div className="col-span-2">
                <SortButton field="lastMessage">Last Message</SortButton>
              </div>
              <div className="col-span-1 text-center">Status</div>
              <div className="col-span-1 text-center">Messages</div>
              <div className="col-span-1 text-center">Duration</div>
              <div className="col-span-1 text-center">Rating</div>
              <div className="col-span-1 text-center">Actions</div>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-200">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-gray-900 mb-2">No conversations found</h3>
                <p className="text-sm text-gray-600">
                  {searchTerm || filterStatus !== 'all' || filterBot !== 'all' || filterUser !== 'all' || filterDateRange !== 'all'
                    ? 'Try adjusting your search or filter criteria.'
                    : 'No conversations have been recorded yet.'}
                </p>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className="px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={(e) => {
                    // Don't navigate if clicking on dropdown or action buttons
                    const target = e.target as HTMLElement;
                    if (!target.closest('[role="menuitem"]') && !target.closest('button')) {
                      handleViewConversation(conversation.id);
                    }
                  }}
                >
                  <div className="grid grid-cols-12 gap-3 items-center">
                    {/* User */}
                    <div className="col-span-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-600">
                            {conversation.userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-900 truncate">{conversation.userName}</p>
                          <p className="text-xs text-gray-500 truncate">{conversation.userEmail}</p>
                        </div>
                      </div>
                    </div>

                    {/* Bot */}
                    <div className="col-span-2">
                      <div className="flex items-center space-x-2">
                        <Bot className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-900 truncate">{conversation.botName}</span>
                      </div>
                    </div>

                    {/* Last Message */}
                    <div className="col-span-2">
                      <p className="text-xs text-gray-900">{formatRelativeTime(conversation.lastMessageTime)}</p>
                      <p className="text-xs text-gray-500">{formatTime(conversation.lastMessageTime)}</p>
                    </div>

                    {/* Status */}
                    <div className="col-span-1 flex justify-center">
                      <Badge className={`text-xs px-2 py-0.5 ${getStatusColor(conversation.status)}`}>
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

                    {/* Rating */}
                    <div className="col-span-1 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <span className="text-yellow-400 text-xs">★</span>
                        <span className="text-xs text-gray-900">{conversation.satisfaction}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 flex justify-center">
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="h-6 w-6 p-0 border-gray-200 text-gray-600 hover:bg-gray-50">
                            <MoreHorizontal className="w-3 h-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" side="top" sideOffset={5} onEscapeKeyDown={(e) => e.preventDefault()}>
                          <DropdownMenuItem
                            onClick={() => handleViewConversation(conversation.id)}
                            className="cursor-pointer"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleExportConversation(conversation.id)}
                            className="cursor-pointer"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Export Chat
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteConversation(conversation.id)}
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
        </div>
      </div>
    </RoleGuard>
  );
};

export default ManagerConversationsPage;
