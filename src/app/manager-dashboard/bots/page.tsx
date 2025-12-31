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

// Notification types
type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
}

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
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignKnowledgeModal, setShowAssignKnowledgeModal] = useState(false);
  const [editingBot, setEditingBot] = useState<any>(null);
  const [assigningKnowledgeBot, setAssigningKnowledgeBot] = useState<any>(null);
  const [selectedKnowledgeIds, setSelectedKnowledgeIds] = useState<string[]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Notification helper functions
  const showNotification = (type: NotificationType, title: string, message: string) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotificationStyles = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return { bg: 'bg-green-50', border: 'border-green-200', icon: '✅', iconBg: 'bg-green-100', text: 'text-green-800', titleText: 'text-green-900' };
      case 'error':
        return { bg: 'bg-red-50', border: 'border-red-200', icon: '❌', iconBg: 'bg-red-100', text: 'text-red-800', titleText: 'text-red-900' };
      case 'warning':
        return { bg: 'bg-yellow-50', border: 'border-yellow-200', icon: '⚠️', iconBg: 'bg-yellow-100', text: 'text-yellow-800', titleText: 'text-yellow-900' };
      case 'info':
        return { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'ℹ️', iconBg: 'bg-blue-100', text: 'text-blue-800', titleText: 'text-blue-900' };
    }
  };

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
      // Validate domain format (must be valid https:// URL)
      if (!newBot.domain || newBot.domain.trim() === '') {
        showNotification('warning', 'Domain Required', 'Please enter a domain URL for your bot.');
        return;
      }

      // Check if domain starts with https://
      if (!newBot.domain.startsWith('https://')) {
        showNotification('warning', 'Invalid Domain Format', 'Domain must start with https:// (e.g., https://yoursite.com)');
        return;
      }

      // Validate URL format
      try {
        new URL(newBot.domain);
      } catch (urlError) {
        showNotification('error', 'Invalid URL', 'Please enter a valid URL (e.g., https://yoursite.com)');
        return;
      }

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

        // Check if it's a plan limit error
        if (errorData.upgradeRequired) {
          showNotification('warning', 'Upgrade Required', `${errorData.message} Current: ${errorData.currentCount}/${errorData.limit} bots.`);
          // Optionally redirect to billing page
          if (confirm(`${errorData.message}\n\nWould you like to upgrade your plan?`)) {
            router.push(errorData.upgradeUrl || '/manager-dashboard/billing');
          }
        } else {
          showNotification('error', 'Bot Creation Failed', errorData.error || 'Failed to create bot. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error creating bot:', error);
      showNotification('error', 'Bot Creation Failed', 'An unexpected error occurred. Please try again.');
    }
  };

  const handleDocumentSelect = (documentId: string) => {
    const documentToSelect = availableDocuments.find(d => d.id === documentId);
    if (!documentToSelect) return;

    const docNameLower = (documentToSelect.name || '').toLowerCase().trim();

    setNewBot(prev => {
      // If document is already selected by ID, remove it (toggle behavior)
      if (prev.documentIds.includes(documentId)) {
        return {
          ...prev,
          documentIds: prev.documentIds.filter(id => id !== documentId)
        };
      }

      // Check if a document with the same name is already selected from available docs
      const selectedDocs = prev.documentIds
        .map(id => availableDocuments.find(d => d.id === id))
        .filter(Boolean);

      const duplicateInSelected = selectedDocs.some(
        doc => (doc.name || '').toLowerCase().trim() === docNameLower
      );

      if (duplicateInSelected) {
        showNotification('warning', 'Duplicate Document', `A document named "${documentToSelect.name}" is already selected.`);
        return prev; // Return unchanged state
      }

      // Check if a document with the same name was newly uploaded
      const duplicateInNewDocs = prev.newDocuments.some(
        doc => (doc.name || doc.originalName || '').toLowerCase().trim() === docNameLower
      );

      if (duplicateInNewDocs) {
        showNotification('warning', 'Duplicate Document', `A document named "${documentToSelect.name}" was already uploaded.`);
        return prev; // Return unchanged state
      }

      // No duplicate name found, add the document
      return {
        ...prev,
        documentIds: [...prev.documentIds, documentId]
      };
    });
  };

  const handleDocumentUpload = async (files: FileList) => {
    // FIX: Prevent duplicate uploads by checking if already uploading
    if (isUploadingDocument) {
      console.log('Upload already in progress, skipping...');
      return;
    }

    setIsUploadingDocument(true);
    try {
      const formData = new FormData();
      let hasValidFiles = false;
      const filesBeingAdded: string[] = []; // Track files being added in this batch

      Array.from(files).forEach(file => {
        const fileNameLower = file.name.toLowerCase().trim();

        // FIX: Check for duplicate files before adding to FormData
        // 1. Check if this exact file is already being added in this batch (multi-select same file)
        if (filesBeingAdded.includes(fileNameLower)) {
          showNotification('warning', 'Duplicate File', `File "${file.name}" is already being uploaded.`);
          return; // Skip this file
        }

        // 2. Check against newly uploaded documents in this session
        const isDuplicateInNewDocs = newBot.newDocuments.some(
          doc => (doc.name || doc.originalName || '').toLowerCase().trim() === fileNameLower
        );
        if (isDuplicateInNewDocs) {
          showNotification('warning', 'Duplicate File', `File "${file.name}" is already added.`);
          return; // Skip this file
        }

        // 3. Check against selected documents from available list
        const isDuplicateInSelected = newBot.documentIds.some(docId => {
          const doc = availableDocuments.find(d => d.id === docId);
          return doc && (doc.name || '').toLowerCase().trim() === fileNameLower;
        });
        if (isDuplicateInSelected) {
          showNotification('warning', 'Duplicate File', `File "${file.name}" is already selected from knowledge base.`);
          return; // Skip this file
        }

        // 4. Check against ALL existing documents in the database (not just selected)
        const isDuplicateInAvailable = availableDocuments.some(
          doc => (doc.name || '').toLowerCase().trim() === fileNameLower
        );
        if (isDuplicateInAvailable) {
          showNotification('warning', 'Duplicate File', `Document "${file.name}" already exists in knowledge base.`);
          return; // Skip this file
        }

        // File passed all duplicate checks, add it
        formData.append('documents', file);
        filesBeingAdded.push(fileNameLower);
        hasValidFiles = true;
      });

      // If no valid files to upload, exit early
      if (!hasValidFiles) {
        setIsUploadingDocument(false);
        return;
      }

      const response = await fetch('/api/manager/documents', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        // FIX: Add uploaded document IDs to documentIds (not newDocuments)
        // This ensures the KB checkbox gets checked and prevents duplicates
        const uploadedDocIds = data.documents.map((doc: any) => doc.id).filter(Boolean);
        setNewBot(prev => ({
          ...prev,
          documentIds: [...prev.documentIds, ...uploadedDocIds]
        }));
        // Refresh available documents so the uploaded files appear in KB list
        loadDocuments();

        // Check if any SVG or image files were uploaded and show specific notification
        const uploadedFiles = Array.from(files);
        const imageExtensions = ['.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp'];
        const uploadedImages = uploadedFiles.filter(file =>
          imageExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
        );

        if (uploadedImages.length > 0) {
          const imageNames = uploadedImages.map(f => f.name).join(', ');
          showNotification('success', 'Image Uploaded', `Image file${uploadedImages.length > 1 ? 's' : ''} uploaded: ${imageNames}`);
        } else {
          showNotification('success', 'Upload Successful', 'Documents uploaded successfully.');
        }
      } else {
        const errorData = await response.json();
        showNotification('error', 'Upload Failed', errorData.error || 'Failed to upload documents.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      showNotification('error', 'Upload Failed', 'An unexpected error occurred while uploading.');
    } finally {
      setIsUploadingDocument(false);
    }
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

  const handleEditBot = (bot: any) => {
    setEditingBot({...bot});
    // Pre-load assigned knowledge IDs
    const assignedIds = bot.documents?.map((doc: any) => doc.id) || [];
    setSelectedKnowledgeIds(assignedIds);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      // Validate domain
      if (editingBot.domain && !editingBot.domain.startsWith('https://')) {
        showNotification('warning', 'Invalid Domain Format', 'Domain must start with https:// (e.g., https://yoursite.com)');
        return;
      }

      const response = await fetch('/api/manager/update-bot', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingBot.id,
          name: editingBot.name,
          description: editingBot.description,
          domain: editingBot.domain,
          status: editingBot.status,
          knowledgeIds: selectedKnowledgeIds
        })
      });

      if (response.ok) {
        showNotification('success', 'Bot Updated', 'Your bot has been updated successfully!');
        setShowEditModal(false);
        setEditingBot(null);
        setSelectedKnowledgeIds([]);
        loadBots();
      } else {
        const error = await response.json();
        showNotification('error', 'Update Failed', error.error || 'Failed to update bot. Please try again.');
      }
    } catch (error) {
      console.error('Error updating bot:', error);
      showNotification('error', 'Update Failed', 'An unexpected error occurred. Please try again.');
    }
  };

  const handleAssignKnowledge = async (bot: any) => {
    setAssigningKnowledgeBot(bot);
    // Fetch bot's current documents and pre-check them
    const assignedIds = bot.documents?.map((doc: any) => doc.id) || [];
    setSelectedKnowledgeIds(assignedIds);
    setShowAssignKnowledgeModal(true);
  };

  const handleSaveKnowledge = async () => {
    try {
      const response = await fetch('/api/manager/assign-knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botId: assigningKnowledgeBot.id,
          documentIds: selectedKnowledgeIds
        })
      });

      if (response.ok) {
        const data = await response.json();
        showNotification('success', 'Knowledge Assigned', data.message || `${selectedKnowledgeIds.length} document(s) assigned successfully!`);
        setShowAssignKnowledgeModal(false);
        setAssigningKnowledgeBot(null);
        setSelectedKnowledgeIds([]);
        loadBots();
      } else {
        const error = await response.json();
        showNotification('error', 'Assignment Failed', error.error || 'Failed to assign knowledge. Please try again.');
      }
    } catch (error) {
      console.error('Error assigning knowledge:', error);
      showNotification('error', 'Assignment Failed', 'An unexpected error occurred. Please try again.');
    }
  };

  const handleTrainBot = async (bot: any) => {
    if (!bot.documents || bot.documents.length === 0) {
      showNotification('warning', 'No Documents', 'Please assign documents to this bot before training.');
      return;
    }

    if (!confirm(`Train ${bot.name}? This may take a few minutes.`)) {
      return;
    }

    try {
      setIsTraining(true);
      showNotification('info', 'Training Started', `Training ${bot.name}... This may take a few minutes.`);

      const response = await fetch('/api/manager/train-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botId: bot.id })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const successfulDocs = data.summary?.successfulDocuments || 0;
        const totalDocs = data.summary?.totalDocuments || 0;
        const totalEmbeddings = data.summary?.totalEmbeddings || 0;
        showNotification('success', 'Training Complete', `${data.message || 'Training successful!'} Documents: ${successfulDocs}/${totalDocs}, Embeddings: ${totalEmbeddings}`);
        loadBots();
      } else {
        showNotification('error', 'Training Failed', data.error || data.message || 'Unknown error occurred during training.');
      }
    } catch (error) {
      console.error('Training error:', error);
      showNotification('error', 'Training Failed', 'An unexpected error occurred during training.');
    } finally {
      setIsTraining(false);
    }
  };

  const handleToggleKnowledge = (docId: string) => {
    setSelectedKnowledgeIds(prev =>
      prev.includes(docId)
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Notification Container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-md">
        {notifications.map((notification) => {
          const styles = getNotificationStyles(notification.type);
          return (
            <div
              key={notification.id}
              className={`${styles.bg} ${styles.border} border rounded-2xl shadow-lg p-4 animate-in slide-in-from-right duration-300`}
            >
              <div className="flex items-start gap-3">
                <div className={`${styles.iconBg} w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0`}>
                  {styles.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`font-semibold ${styles.titleText}`}>{notification.title}</h4>
                  <p className={`text-sm ${styles.text} mt-0.5`}>{notification.message}</p>
                </div>
                <button
                  onClick={() => dismissNotification(notification.id)}
                  className={`${styles.text} hover:opacity-70 transition-opacity p-1`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

        {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/manager-dashboard')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
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
                <label className="text-sm font-medium text-gray-700 block mb-1">System Prompt / Bot Instructions</label>
                <p className="text-xs text-gray-500 mb-2">
                  Define your bot's personality, behavior, and response style. This will guide how the bot interacts with users.
                </p>
                <textarea
                  value={newBot.description}
                  onChange={(e) => setNewBot({...newBot, description: e.target.value})}
                  placeholder="Example: You are a friendly and professional customer support assistant. Your role is to help users with their questions about our products and services. You should always be polite, concise, and helpful."
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={5}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Domain</label>
                <p className="text-xs text-gray-500 mb-1">Must be a full https:// URL (e.g., https://yoursite.com)</p>
                <Input
                  value={newBot.domain}
                  onChange={(e) => setNewBot({...newBot, domain: e.target.value})}
                  placeholder="e.g., https://support.yoursite.com"
                  className="mt-1"
                  type="url"
                  pattern="https://.*"
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
                      accept=".pdf,.doc,.docx,.txt,.csv,.json,.svg,.png,.jpg,.jpeg,.gif,.webp"
                      onChange={(e) => {
                        if (e.target.files) {
                          handleDocumentUpload(e.target.files);
                          e.target.value = ''; // Clear to prevent double upload bug
                        }
                      }}
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
              <div key={bot.id} className="bg-white p-5 rounded-[20px] border border-gray-200 shadow-sm hover:shadow-lg transition-shadow">
                {/* Top Section - Bot Info & Menu */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#6038ff] rounded-xl flex items-center justify-center text-white text-2xl">
                      🤖
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-lg text-gray-900 truncate">{bot.name}</h3>
                      <a
                        href={bot.domain}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[#4c7bff] hover:underline truncate block"
                      >
                        {bot.domain}
                      </a>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="text-xl text-gray-500 hover:text-gray-700 cursor-pointer p-1">
                        ⋯
                      </button>
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
                      <DropdownMenuItem onClick={() => handleAssignKnowledge(bot)}>
                        <Settings className="w-4 h-4 mr-2" />
                        Assign Knowledge
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditBot(bot)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Bot
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleTrainBot(bot)} disabled={isTraining}>
                        <PlayCircle className="w-4 h-4 mr-2" />
                        {isTraining ? 'Training...' : 'Train Bot'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Bot
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Status & Timestamp Row */}
                <div className="flex items-center justify-between mt-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${
                    bot.status === 'active'
                      ? 'bg-[#d9ffe3] text-[#0c8f3c]'
                      : bot.status === 'paused'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      bot.status === 'active' ? 'bg-[#0c8f3c]' : bot.status === 'paused' ? 'bg-yellow-600' : 'bg-gray-500'
                    }`}></span>
                    {bot.status}
                  </span>
                  <span className="bg-[#eef1f6] text-gray-600 px-3 py-1 rounded-full text-xs">
                    {bot.lastActive || new Date(bot.updatedAt).toLocaleString()}
                  </span>
                </div>

                {/* Stats Grid - 2x2 */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {/* Conversations */}
                  <div className="bg-[#f8fcff] border border-[#e2eefa] p-3 rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 bg-[#00c27a] rounded-lg flex items-center justify-center text-white text-lg">
                        💬
                      </div>
                      <span className="text-sm font-semibold text-gray-700">Conversations</span>
                    </div>
                    <p className="text-xl font-bold text-gray-900 mt-2">{bot.conversations || 0}</p>
                  </div>

                  {/* Assigned Users */}
                  <div className="bg-[#f8fcff] border border-[#e2eefa] p-3 rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 bg-[#6a5cff] rounded-lg flex items-center justify-center text-white text-lg">
                        👤
                      </div>
                      <span className="text-sm font-semibold text-gray-700">Assigned</span>
                    </div>
                    <p className="text-xl font-bold text-gray-900 mt-2">{bot.totalUsers || 0}</p>
                  </div>

                  {/* Knowledge */}
                  <div className="bg-[#f8fcff] border border-[#e2eefa] p-3 rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 bg-[#ff9f3e] rounded-lg flex items-center justify-center text-white text-lg">
                        📘
                      </div>
                      <span className="text-sm font-semibold text-gray-700">Knowledge</span>
                    </div>
                    <p className="text-xl font-bold text-gray-900 mt-2">{bot.documents?.length || 0}</p>
                  </div>

                  {/* Webpages */}
                  <div className="bg-[#f8fcff] border border-[#e2eefa] p-3 rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 bg-[#29d0f2] rounded-lg flex items-center justify-center text-white text-lg">
                        🌐
                      </div>
                      <span className="text-sm font-semibold text-gray-700">Webpages</span>
                    </div>
                    <p className="text-xl font-bold text-gray-900 mt-2">{bot.webpagesCount || 0}</p>
                  </div>
                </div>

                {/* Bottom Buttons */}
                <div className="flex gap-3 mt-5">
                  <button
                    onClick={() => handleViewConversations(bot)}
                    className="flex-1 py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-[#f5f5f5] border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    📄 Conversations
                  </button>
                  <button
                    onClick={() => setShowAssignModal(true)}
                    className="flex-1 py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-[#003eff] text-white hover:bg-[#0035d9] transition-colors"
                  >
                    👥 Manage Users
                  </button>
                </div>

                {/* Footer - Created & Last Updated */}
                <div className="mt-4 text-xs text-gray-500">
                  <p>Created: {new Date(bot.createdAt).toLocaleDateString()}</p>
                  <p>Last: {new Date(bot.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
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

      {/* Edit Bot Modal */}
      {showEditModal && editingBot && (
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Bot</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Bot Name</label>
                <Input
                  value={editingBot.name}
                  onChange={(e) => setEditingBot({...editingBot, name: e.target.value})}
                  placeholder="Enter bot name"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Description / Instructions</label>
                <textarea
                  value={editingBot.description}
                  onChange={(e) => setEditingBot({...editingBot, description: e.target.value})}
                  placeholder="Bot instructions and personality"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={5}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Domain</label>
                <Input
                  value={editingBot.domain}
                  onChange={(e) => setEditingBot({...editingBot, domain: e.target.value})}
                  placeholder="e.g., https://yoursite.com"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <Select value={editingBot.status} onValueChange={(value) => setEditingBot({...editingBot, status: value})}>
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

              {/* Knowledge Base Selection */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Knowledge Base Documents ({selectedKnowledgeIds.length} selected)
                </label>
                <div className="max-h-60 overflow-y-auto border rounded-lg p-2 space-y-2">
                  {availableDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        selectedKnowledgeIds.includes(doc.id)
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleToggleKnowledge(doc.id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedKnowledgeIds.includes(doc.id)}
                        onChange={() => handleToggleKnowledge(doc.id)}
                        className="rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                        <p className="text-xs text-gray-500">{doc.type.toUpperCase()} • {Math.round(doc.size / 1024)} KB</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {selectedKnowledgeIds.length} document(s) assigned (uncheck to remove)
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => {
                  setShowEditModal(false);
                  setEditingBot(null);
                  setSelectedKnowledgeIds([]);
                }}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit} className="bg-[#6566F1] hover:bg-[#5A5BD9]">
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Assign Knowledge Modal */}
      {showAssignKnowledgeModal && assigningKnowledgeBot && (
        <Dialog open={showAssignKnowledgeModal} onOpenChange={setShowAssignKnowledgeModal}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Assign Knowledge to {assigningKnowledgeBot.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  Select documents to train this bot. Checked documents are currently assigned.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Available Documents
                  </label>
                  <span className="text-sm text-gray-600">
                    {selectedKnowledgeIds.length} selected
                  </span>
                </div>
                <div className="max-h-96 overflow-y-auto border rounded-lg p-2 space-y-2">
                  {availableDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedKnowledgeIds.includes(doc.id)
                          ? 'bg-green-50 border border-green-200'
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                      onClick={() => handleToggleKnowledge(doc.id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedKnowledgeIds.includes(doc.id)}
                        onChange={() => handleToggleKnowledge(doc.id)}
                        className="rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                        <p className="text-xs text-gray-500">
                          {doc.type.toUpperCase()} • {Math.round(doc.size / 1024)} KB
                        </p>
                      </div>
                      {selectedKnowledgeIds.includes(doc.id) && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                  ))}
                  {availableDocuments.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-8">
                      No documents available. Upload documents in the Knowledge Base first.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => {
                  setShowAssignKnowledgeModal(false);
                  setAssigningKnowledgeBot(null);
                  setSelectedKnowledgeIds([]);
                }}>
                  Cancel
                </Button>
                <Button onClick={handleSaveKnowledge} className="bg-[#6566F1] hover:bg-[#5A5BD9]">
                  Assign {selectedKnowledgeIds.length} Document(s)
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      </div>
  );
};

export default BotsPage;
