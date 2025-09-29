'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  MoreHorizontal,
  Bot,
  Eye,
  Edit,
  PlayCircle,
  Settings,
  Trash2,
  Users,
  MessageSquare,
  ArrowLeft,
  X,
  UserPlus,
  UserMinus,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Calendar,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Mock data
const mockBots = [
  {
    id: "1",
    name: "Customer Support Bot",
    status: "active",
    conversations: 1247,
    lastActive: "2 minutes ago",
    knowledgeBase: 23,
    domain: "support.yoursite.com",
    assignedUsers: ["john.doe@company.com", "jane.smith@company.com", "mike.wilson@company.com"],
    totalUsers: 3,
    description: "Handles customer support inquiries and technical issues",
    createdAt: "2024-01-15",
    lastConversation: "2024-09-03T10:30:00Z"
  },
  {
    id: "2",
    name: "Sales Assistant",
    status: "paused",
    conversations: 892,
    lastActive: "1 hour ago",
    knowledgeBase: 15,
    domain: "shop.yoursite.com",
    assignedUsers: ["sarah.jones@company.com", "alex.brown@company.com"],
    totalUsers: 2,
    description: "Assists with sales inquiries and product recommendations",
    createdAt: "2024-02-20",
    lastConversation: "2024-09-02T16:45:00Z"
  },
  {
    id: "3",
    name: "FAQ Helper",
    status: "active",
    conversations: 534,
    lastActive: "5 minutes ago",
    knowledgeBase: 8,
    domain: "help.yoursite.com",
    assignedUsers: ["emma.davis@company.com"],
    totalUsers: 1,
    description: "Provides quick answers to frequently asked questions",
    createdAt: "2024-03-10",
    lastConversation: "2024-09-03T11:15:00Z"
  }
];

const mockUsers = [
  { id: "1", name: "John Doe", email: "john.doe@company.com", role: "Agent", status: "online" },
  { id: "2", name: "Jane Smith", email: "jane.smith@company.com", role: "Agent", status: "busy" },
  { id: "3", name: "Mike Wilson", email: "mike.wilson@company.com", role: "Agent", status: "offline" },
  { id: "4", name: "Sarah Jones", email: "sarah.jones@company.com", role: "Agent", status: "online" },
  { id: "5", name: "Alex Brown", email: "alex.brown@company.com", role: "Agent", status: "online" },
  { id: "6", name: "Emma Davis", email: "emma.davis@company.com", role: "Agent", status: "busy" },
  { id: "7", name: "Tom Miller", email: "tom.miller@company.com", role: "Agent", status: "offline" },
  { id: "8", name: "Lisa Garcia", email: "lisa.garcia@company.com", role: "Agent", status: "online" }
];

const mockConversations = [
  {
    id: "1",
    botId: "1",
    customerName: "Alice Johnson",
    customerEmail: "alice@example.com",
    startTime: "2024-09-03T10:30:00Z",
    endTime: "2024-09-03T10:45:00Z",
    status: "resolved",
    messages: [
      { id: "1", sender: "customer", content: "Hi, I'm having trouble with my order", timestamp: "2024-09-03T10:30:00Z" },
      { id: "2", sender: "bot", content: "I'd be happy to help you with your order. Can you please provide your order number?", timestamp: "2024-09-03T10:30:15Z" },
      { id: "3", sender: "customer", content: "My order number is #12345", timestamp: "2024-09-03T10:31:00Z" },
      { id: "4", sender: "bot", content: "Thank you! I can see your order is currently being processed. It should ship within 2-3 business days.", timestamp: "2024-09-03T10:31:30Z" },
      { id: "5", sender: "customer", content: "Great, thank you for the help!", timestamp: "2024-09-03T10:32:00Z" }
    ]
  },
  {
    id: "2",
    botId: "1",
    customerName: "Bob Smith",
    customerEmail: "bob@example.com",
    startTime: "2024-09-03T09:15:00Z",
    endTime: "2024-09-03T09:30:00Z",
    status: "escalated",
    messages: [
      { id: "1", sender: "customer", content: "I need to return a product", timestamp: "2024-09-03T09:15:00Z" },
      { id: "2", sender: "bot", content: "I can help you with your return. What's the reason for the return?", timestamp: "2024-09-03T09:15:20Z" },
      { id: "3", sender: "customer", content: "The product arrived damaged", timestamp: "2024-09-03T09:16:00Z" },
      { id: "4", sender: "bot", content: "I'm sorry to hear that. Let me connect you with a human agent who can assist you with the damaged product return.", timestamp: "2024-09-03T09:16:30Z" }
    ]
  }
];

const BotsPage = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedBot, setSelectedBot] = useState<{id: string; name: string} | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showConversationHistory, setShowConversationHistory] = useState(false);
  const [availableDocuments, setAvailableDocuments] = useState<any[]>([]);
  const [documentSearchTerm, setDocumentSearchTerm] = useState("");
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [bots, setBots] = useState<any[]>([]);
  const [loadingBots, setLoadingBots] = useState(true);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [statusDropdownPosition, setStatusDropdownPosition] = useState({ top: 0, left: 0 });
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const [newBot, setNewBot] = useState({
    name: "",
    description: "",
    domain: "",
    status: "active",
    documentIds: [] as string[],
    newDocuments: [] as any[]
  });

  const statusOptions = [
    { value: 'all', label: 'All Status', icon: '📊' },
    { value: 'active', label: 'Active', icon: '✅' },
    { value: 'paused', label: 'Paused', icon: '⏸️' },
    { value: 'inactive', label: 'Inactive', icon: '❌' }
  ];

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online": return <div className="w-2 h-2 bg-green-500 rounded-full"></div>;
      case "busy": return <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>;
      case "offline": return <div className="w-2 h-2 bg-gray-400 rounded-full"></div>;
      default: return <div className="w-2 h-2 bg-gray-400 rounded-full"></div>;
    }
  };

  // Load available documents
  const loadDocuments = useCallback(async () => {
    try {
      const response = await fetch('/api/manager/bot-documents');
      if (response.ok) {
        const data = await response.json();
        setAvailableDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  }, []);

  // Load bots
  const loadBots = useCallback(async () => {
    try {
      setLoadingBots(true);
      const response = await fetch('/api/manager/bots');
      if (response.ok) {
        const data = await response.json();
        setBots(data.bots || []);
      }
    } catch (error) {
      console.error('Error loading bots:', error);
    } finally {
      setLoadingBots(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
    loadBots();
  }, [loadDocuments, loadBots]);

  // Handle status dropdown
  const toggleStatusDropdown = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setStatusDropdownPosition({
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX
    });
    setIsStatusDropdownOpen(!isStatusDropdownOpen);
  };

  const handleStatusSelect = (value: string) => {
    setFilterStatus(value);
    setIsStatusDropdownOpen(false);
  };

  // Handle click outside for status dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
    };

    if (isStatusDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isStatusDropdownOpen]);

  const handleCreateBot = async () => {
    try {
      const response = await fetch('/api/manager/create-bot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newBot),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Bot created successfully:', data);
        setShowCreateModal(false);
        setNewBot({ 
          name: "", 
          description: "", 
          domain: "", 
          status: "active",
          documentIds: [],
          newDocuments: []
        });
        // Refresh the bot list
        loadBots();
      } else {
        const errorData = await response.json();
        console.error('Error creating bot:', errorData.error);
        alert('Error creating bot: ' + errorData.error);
      }
    } catch (error) {
      console.error('Error creating bot:', error);
      alert('Error creating bot: ' + error);
    }
  };

  const handleDocumentSelect = (documentId: string) => {
    setNewBot(prev => ({
      ...prev,
      documentIds: prev.documentIds.includes(documentId)
        ? prev.documentIds.filter(id => id !== documentId)
        : [...prev.documentIds, documentId]
    }));
  };

  const handleDocumentUpload = async (files: FileList) => {
    setIsUploadingDocument(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('documents', file);
      });

      const response = await fetch('/api/manager/documents', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setNewBot(prev => ({
          ...prev,
          newDocuments: [...prev.newDocuments, ...data.documents]
        }));
        // Refresh available documents
        loadDocuments();
      } else {
        const errorData = await response.json();
        alert('Upload failed: ' + errorData.error);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed: ' + error);
    }
    setIsUploadingDocument(false);
  };

  const handleAssignUser = (botId: string, userEmail: string) => {
    // In a real app, this would make an API call
    console.log("Assigning user", userEmail, "to bot", botId);
  };

  const handleUnassignUser = (botId: string, userEmail: string) => {
    // In a real app, this would make an API call
    console.log("Unassigning user", userEmail, "from bot", botId);
  };

  const handleViewConversations = (bot: {id: string; name: string}) => {
    setSelectedBot(bot);
    setShowConversationHistory(true);
  };

  const getBotConversations = (botId: string) => {
    return mockConversations.filter(conv => conv.botId === botId);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>

      {/* Page Title */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
          <h1 className="text-2xl font-bold text-gray-900">Bot Management</h1>
          <p className="text-sm text-gray-600 mt-1">Create, manage, and assign users to your AI chatbots</p>
          </div>
        <Dialog>
          <DialogTrigger>
            <Button className="bg-[#6566F1] hover:bg-[#5A5BD9] text-white rounded-2xl">
            <Plus className="w-4 h-4 mr-2" />
            Create Bot
          </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Bot</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Bot Name</label>
                <Input
                  value={newBot.name}
                  onChange={(e) => setNewBot({...newBot, name: e.target.value})}
                  placeholder="Enter bot name"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Description</label>
                <Input
                  value={newBot.description}
                  onChange={(e) => setNewBot({...newBot, description: e.target.value})}
                  placeholder="Enter bot description"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Domain</label>
                <Input
                  value={newBot.domain}
                  onChange={(e) => setNewBot({...newBot, domain: e.target.value})}
                  placeholder="e.g., support.yoursite.com"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <Select value={newBot.status} onValueChange={(value) => setNewBot({...newBot, status: value})}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Document Selection */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Knowledge Base Documents</label>
                <div className="space-y-3">
                  {/* Search Documents */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      value={documentSearchTerm}
                      onChange={(e) => setDocumentSearchTerm(e.target.value)}
                      placeholder="Search documents..."
                      className="pl-10"
                    />
                  </div>

                  {/* Document List */}
                  <div className="max-h-40 overflow-y-auto border rounded-lg p-2 space-y-2">
                    {availableDocuments
                      .filter(doc => 
                        doc.name.toLowerCase().includes(documentSearchTerm.toLowerCase())
                      )
                      .map((doc) => (
                        <div
                          key={doc.id}
                          className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${
                            newBot.documentIds.includes(doc.id)
                              ? 'bg-blue-50 border border-blue-200'
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => handleDocumentSelect(doc.id)}
                        >
                          <input
                            type="checkbox"
                            checked={newBot.documentIds.includes(doc.id)}
                            onChange={() => handleDocumentSelect(doc.id)}
                            className="rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {doc.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {doc.type.toUpperCase()} • {Math.round(doc.size / 1024)} KB
                            </p>
                          </div>
                        </div>
                      ))}
                    {availableDocuments.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No documents available. Upload some documents in the Knowledge Base first.
                      </p>
                    )}
                  </div>

                  {/* Upload New Documents */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={(e) => e.target.files && handleDocumentUpload(e.target.files)}
                      className="hidden"
                      id="document-upload"
                    />
                    <label
                      htmlFor="document-upload"
                      className="cursor-pointer flex flex-col items-center space-y-2"
                    >
                      <Plus className="w-6 h-6 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {isUploadingDocument ? 'Uploading...' : 'Upload New Documents'}
                      </span>
                    </label>
                  </div>

                  {/* Selected Documents Summary */}
                  {(newBot.documentIds.length > 0 || newBot.newDocuments.length > 0) && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-green-800 mb-2">
                        Selected Documents ({newBot.documentIds.length + newBot.newDocuments.length})
                      </p>
                      <div className="space-y-1">
                        {newBot.documentIds.map(id => {
                          const doc = availableDocuments.find(d => d.id === id);
                          return doc ? (
                            <p key={id} className="text-xs text-green-700">• {doc.name}</p>
                          ) : null;
                        })}
                        {newBot.newDocuments.map((doc, index) => (
                          <p key={`new-${index}`} className="text-xs text-green-700">• {doc.name} (new)</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateBot} className="bg-[#6566F1] hover:bg-[#5A5BD9]">
                  Create Bot
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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
          <div className="relative" ref={statusDropdownRef}>
            <button
              onClick={toggleStatusDropdown}
              className="flex items-center justify-between w-full px-4 py-2 border border-gray-300 rounded-2xl focus:border-[#6566F1] focus:ring-2 focus:ring-[#6566F1]/20 bg-white hover:bg-gray-50 transition-all duration-200 text-left"
            >
              <span className="flex items-center space-x-2">
                <span>{statusOptions.find(opt => opt.value === filterStatus)?.icon}</span>
                <span>{statusOptions.find(opt => opt.value === filterStatus)?.label}</span>
              </span>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                  isStatusDropdownOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isStatusDropdownOpen && (
              <div
                className="absolute z-[9999] mt-2 w-full bg-white/95 backdrop-blur-xl border border-gray-200/80 rounded-2xl shadow-2xl shadow-gray-200/40 ring-2 ring-gray-100/50 overflow-hidden"
                style={{
                  top: statusDropdownPosition.top - window.scrollY,
                  left: statusDropdownPosition.left - window.scrollX,
                  width: '220px'
                }}
              >
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleStatusSelect(option.value)}
                    className={`w-full px-4 py-3 text-left transition-all duration-200 flex items-center space-x-3 group ${
                      filterStatus === option.value
                        ? 'bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-l-4 border-[#6566F1] text-[#6566F1] font-semibold shadow-sm'
                        : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50/30 hover:text-gray-900'
                    }`}
                  >
                    <span className="text-lg group-hover:scale-110 transition-transform duration-200">{option.icon}</span>
                    <span className="flex-1 font-medium">{option.label}</span>
                    {filterStatus === option.value && (
                      <div className="w-5 h-5 bg-[#6566F1] rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bots Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loadingBots ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#6566F1]"></div>
                <span className="text-gray-600">Loading bots...</span>
              </div>
            </div>
          ) : filteredBots.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No bots found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || filterStatus !== "all" 
                  ? "Try adjusting your search or filter criteria."
                  : "Get started by creating your first bot."
                }
              </p>
            </div>
          ) : (
            filteredBots.map((bot) => (
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
                    <DropdownMenuItem onClick={() => handleViewConversations(bot)}>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      View Conversations
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowAssignModal(true)}>
                      <Users className="w-4 h-4 mr-2" />
                      Manage Users
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

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4 text-gray-400" />
                    <span>{bot.conversations} conversations</span>
                    </div>
                    <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span>{bot.totalUsers} assigned</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Settings className="w-4 h-4 text-gray-400" />
                  <span>{bot.documents?.length || 0} knowledge docs</span>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-sm text-gray-600 line-clamp-2">{bot.description}</p>
              </div>

              {/* Document List */}
              {bot.documents && bot.documents.length > 0 && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-500 mb-2">Knowledge Base:</p>
                  <div className="space-y-1">
                    {bot.documents.slice(0, 3).map((doc: any) => (
                      <div key={doc.id} className="flex items-center space-x-2 text-xs">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                        <span className="text-gray-600 truncate">{doc.name}</span>
                        <span className="text-gray-400">({doc.type.toUpperCase()})</span>
                      </div>
                    ))}
                    {bot.documents.length > 3 && (
                      <p className="text-xs text-gray-400">+{bot.documents.length - 3} more documents</p>
                    )}
                  </div>
                </div>
              )}

                  <div className="flex space-x-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 border-gray-300 hover:bg-gray-50 text-gray-700 rounded-2xl"
                  onClick={() => handleViewConversations(bot)}
                    >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Conversations
                    </Button>
                    <Button 
                      size="sm" 
                  className="flex-1 bg-[#6566F1] hover:bg-[#5A5BD9] text-white rounded-2xl"
                  onClick={() => setShowAssignModal(true)}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Manage Users
                </Button>
              </div>
            </CardContent>
          </Card>
            ))
          )}
        </div>

      {/* User Assignment Modal */}
      <Dialog>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Bot Users</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Assigned Users */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Assigned Users</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {mockUsers.filter(user => (selectedBot as { assignedUsers?: string[] })?.assignedUsers?.includes(user.email)).map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(user.status)}
                        <div>
                          <p className="font-medium text-sm">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => selectedBot?.id && handleUnassignUser(selectedBot.id, user.email)}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <UserMinus className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Available Users */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Available Users</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {mockUsers.filter(user => !(selectedBot as { assignedUsers?: string[] })?.assignedUsers?.includes(user.email)).map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(user.status)}
                        <div>
                          <p className="font-medium text-sm">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => selectedBot?.id && handleAssignUser(selectedBot.id, user.email)}
                        className="bg-[#6566F1] hover:bg-[#5A5BD9] text-white"
                      >
                        <UserPlus className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button onClick={() => setShowAssignModal(false)}>
                Close
                    </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Conversation History Modal */}
      <Dialog>
        <DialogContent className="sm:max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5" />
              <span>Conversation History - {selectedBot?.name}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {getBotConversations(selectedBot?.id || '').map((conversation) => (
              <Card key={conversation.id} className="border border-gray-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{conversation.customerName}</h4>
                      <p className="text-sm text-gray-500">{conversation.customerEmail}</p>
                    </div>
                    <div className="text-right">
                      <Badge className={conversation.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {conversation.status}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTime(conversation.startTime)} - {formatTime(conversation.endTime)}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {conversation.messages.map((message) => (
                    <div key={message.id} className={`flex ${message.sender === 'customer' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender === 'customer' 
                          ? 'bg-[#6566F1] text-white' 
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender === 'customer' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="flex justify-end pt-4">
            <Button onClick={() => setShowConversationHistory(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
  );
};

export default BotsPage;
