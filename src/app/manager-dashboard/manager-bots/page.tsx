'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  MoreHorizontal,
  Bot,
  Edit,
  PlayCircle,
  Settings,
  Trash2,
  Users,
  MessageSquare,
  ArrowLeft,
  UserPlus,
  UserMinus,
  Mail,
  X,
  BarChart3,
  CheckCircle,
  PauseCircle,
  XCircle,
  FileText,
  File,
  FileImage,
  Upload,
  Globe,
  AlertTriangle
} from 'lucide-react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
// Removed Radix UI dropdown imports - using custom implementation

// Mock data
const mockBots = [
  {
    id: "1",
    name: "Customer Support Bot",
    description: "Handles customer inquiries and support tickets with AI-powered responses",
    domain: "support.company.com",
    status: "active",
    conversations: 342,
    totalUsers: 5,
    knowledgeBase: 23,
    lastActive: "2 min ago",
    assignedUsers: ["john@company.com", "sarah@company.com"],
    createdAt: "2024-01-15",
    lastConversation: "2024-01-20"
  },
  {
    id: "2",
    name: "Sales Assistant",
    description: "Helps with product information and sales inquiries",
    domain: "sales.company.com",
    status: "active",
    conversations: 189,
    totalUsers: 3,
    knowledgeBase: 15,
    lastActive: "1 hour ago",
    assignedUsers: ["mike@company.com"],
    createdAt: "2024-01-10",
    lastConversation: "2024-01-19"
  },
  {
    id: "3",
    name: "FAQ Helper",
    description: "Answers frequently asked questions about products and services",
    domain: "help.company.com",
    status: "paused",
    conversations: 87,
    totalUsers: 2,
    knowledgeBase: 8,
    lastActive: "3 days ago",
    assignedUsers: ["alice@company.com", "bob@company.com"],
    createdAt: "2024-01-05",
    lastConversation: "2024-01-18"
  }
];

const mockUsers = [
  { id: "1", name: "John Doe", email: "john@company.com", role: "user", status: "online" },
  { id: "2", name: "Sarah Smith", email: "sarah@company.com", role: "user", status: "away" },
  { id: "3", name: "Mike Johnson", email: "mike@company.com", role: "user", status: "online" },
  { id: "4", name: "Alice Brown", email: "alice@company.com", role: "user", status: "offline" },
  { id: "5", name: "Bob Wilson", email: "bob@company.com", role: "user", status: "online" }
];

const mockConversations = [
  {
    id: "1",
    botId: "1",
    customerName: "Jane Customer",
    customerEmail: "jane@example.com",
    startTime: "2024-01-20T10:30:00Z",
    endTime: "2024-01-20T10:45:00Z",
    status: "resolved",
    messages: [
      { id: "1", content: "Hi, I need help with my order", sender: "customer", timestamp: "2024-01-20T10:30:00Z" },
      { id: "2", content: "I'd be happy to help you with your order. Can you provide your order number?", sender: "bot", timestamp: "2024-01-20T10:31:00Z" },
      { id: "3", content: "My order number is #12345", sender: "customer", timestamp: "2024-01-20T10:32:00Z" }
    ]
  }
];

export default function BotsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedBot, setSelectedBot] = useState<{
    id: string;
    name: string;
    assignedUsers: string[];
  } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showConversationHistory, setShowConversationHistory] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showKnowledgeModal, setShowKnowledgeModal] = useState(false);
  const [selectedBotForKnowledge, setSelectedBotForKnowledge] = useState<{id: string; name: string} | null>(null);
  const [botKnowledgeIds, setBotKnowledgeIds] = useState<string[]>([]);
  const [trainingBot, setTrainingBot] = useState<string | null>(null); // Bot ID currently being trained
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    botId: string;
    botName: string;
  } | null>(null);
  const [botSettings, setBotSettings] = useState({
    id: "",
    name: "",
    maxTokens: 2000,
    temperature: 0.7,
    responseTime: "normal",
    autoSaveConversations: true,
    enableAnalytics: true
  });
  const [newBot, setNewBot] = useState({
    name: "",
    description: "",
    domain: "",
    status: "active",
    documentIds: [] as string[],
    newDocuments: [] as Array<{
      name: string;
      type: string;
      size: number;
      filePath: string;
      content: string;
      mimeType: string;
    }>
  });
  const [editBot, setEditBot] = useState({
    id: "",
    name: "",
    description: "",
    domain: "",
    status: "active"
  });
  const [editBotKnowledge, setEditBotKnowledge] = useState<string[]>([]);
  const [knowledgeBase, setKnowledgeBase] = useState<Array<{id: string; name: string}>>([]);
  const [bots, setBots] = useState<Array<{
    id: string;
    name: string;
    description: string;
    domain: string;
    status: string;
    conversations: number;
    totalUsers: number;
    lastActive: string;
    assignedUsers: string[];
    createdAt: string;
    lastConversation: string | null;
    documents?: Array<{ id: string; name: string; type: string; size: number }>;
    webpagesCount?: number;
    documentsCount?: number;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const [users, setUsers] = useState<Array<{id: string; firstName: string; lastName: string; email: string; role: string; createdAt: string; name: string; status: string}>>([]);
  const [botAssignments, setBotAssignments] = useState<Array<{id: string; userId: string; botId: string; assignedAt: string; userEmail: string; userName: string; userStatus: string; userRole: string; botName: string}>>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [assigningUser, setAssigningUser] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Array<{
    id: string;
    message: string;
    sender: 'user' | 'bot';
    timestamp: string;
    isTestMessage: boolean;
  }>>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Array<{
    id: string;
    message: string;
    sender: 'user' | 'bot';
    timestamp: string;
    isTestMessage: boolean;
  }> | null>(null);
  const [showConversationDetail, setShowConversationDetail] = useState(false);
  
  // Document management state
  const [availableDocuments, setAvailableDocuments] = useState<Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    uploadDate: string;
  }>>([]);
  const [documentSearchTerm, setDocumentSearchTerm] = useState('');
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [showAllDocuments, setShowAllDocuments] = useState(false);

  // Custom confirmation modal state
  const [showTrainConfirmModal, setShowTrainConfirmModal] = useState(false);
  const [showRemoveKnowledgeConfirmModal, setShowRemoveKnowledgeConfirmModal] = useState(false);
  const [pendingTrainBot, setPendingTrainBot] = useState<{ id: string; name: string } | null>(null);

  const statusOptions = [
    { value: 'all', label: 'All Status', icon: BarChart3 },
    { value: 'active', label: 'Active', icon: CheckCircle },
    { value: 'paused', label: 'Paused', icon: PauseCircle },
    { value: 'inactive', label: 'Inactive', icon: XCircle }
  ];

  // Fetch bots from API
  const fetchBots = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/manager/bots');
      if (response.ok) {
        const data = await response.json();
        setBots(data.bots || []);
      } else {
        console.error('Failed to fetch bots');
        setBots([]); // Set empty array instead of mock data
      }
    } catch (error) {
      console.error('Error fetching bots:', error);
      setBots([]); // Set empty array instead of mock data
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBots();
    loadDocuments();
  }, []);

  // Fetch users and assignments when modal opens
  const fetchUsersAndAssignments = async (botId: string) => {
    setLoadingUsers(true);
    try {
      // Fetch users invited by manager
      console.log('Fetching users from /api/manager/users...');
      const usersResponse = await fetch('/api/manager/users');
      console.log('Users response status:', usersResponse.status);
      
      let transformedUsers: Array<{id: string; firstName: string; lastName: string; email: string; role: string; createdAt: string; name: string; status: string}> = [];
      
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        console.log('Users data received:', usersData);
        // Transform users to include name and status properties
        transformedUsers = (usersData.users || []).map((user: {id: string; firstName: string; lastName: string; email: string; role: string; createdAt: string; name: string}) => ({
          ...user,
          name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email.split('@')[0] || 'Unknown User',
          status: 'online' // Default status, could be enhanced later
        }));
        setUsers(transformedUsers);
      } else {
        const errorData = await usersResponse.json();
        console.error('Error fetching users:', errorData);
      }

      // Fetch assignments for this bot
      console.log('Fetching assignments for bot:', botId);
      const assignmentsResponse = await fetch(`/api/manager/bot-assignments?botId=${botId}`);
      console.log('Assignments response status:', assignmentsResponse.status);
      
      if (assignmentsResponse.ok) {
        const assignmentsData = await assignmentsResponse.json();
        console.log('Assignments data received:', assignmentsData);
        
        // Use the assignments data directly from API (it already includes user info)
        setBotAssignments(assignmentsData.assignments || []);
      } else {
        const errorData = await assignmentsResponse.json();
        console.error('Error fetching assignments:', errorData);
      }
    } catch (error) {
      console.error('Error fetching users and assignments:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Close dropdown when clicking outside or scrolling
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown) {
        setOpenDropdown(null);
        setDropdownPosition(null);
      }
      if (isStatusDropdownOpen && statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
    };

    const handleScroll = () => {
      if (openDropdown) {
        setOpenDropdown(null);
        setDropdownPosition(null);
      }
      if (isStatusDropdownOpen) {
        setIsStatusDropdownOpen(false);
      }
    };

    if (openDropdown || isStatusDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true); // Use capture phase
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [openDropdown, isStatusDropdownOpen]);

  // Close modals with Escape key
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showCreateModal) {
          setShowCreateModal(false);
          // Reset document selection when closing modal
          setNewBot(prev => ({
            ...prev,
            documentIds: [],
            newDocuments: []
          }));
          setDocumentSearchTerm('');
        } else if (showEditModal) {
          setShowEditModal(false);
        } else if (showAssignModal) {
          setShowAssignModal(false);
        } else if (showConversationHistory) {
          setShowConversationHistory(false);
        } else if (showConversationDetail) {
          setShowConversationDetail(false);
        } else if (showSettingsModal) {
          setShowSettingsModal(false);
        }
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [showCreateModal, showEditModal, showAssignModal, showConversationHistory, showConversationDetail, showSettingsModal]);

  const filteredBots = bots.filter(bot => {
    const matchesSearch = bot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bot.domain.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || bot.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    const color = status === 'online' ? 'bg-green-500' : status === 'away' ? 'bg-yellow-500' : 'bg-gray-400';
    return <div className={`w-2 h-2 rounded-full ${color}`}></div>;
  };

  // Load available documents
  const loadDocuments = async () => {
    try {
      setLoadingDocuments(true);
      const response = await fetch('/api/manager/bot-documents');
      if (response.ok) {
        const data = await response.json();
        console.log('Loaded documents:', data.documents);
        setAvailableDocuments(data.documents || []);
        // Also populate knowledge base for edit modal
        setKnowledgeBase((data.documents || []).map((doc: any) => ({
          id: doc.id,
          name: doc.name
        })));
      } else {
        console.error('Failed to load documents:', response.status, response.statusText);
        setAvailableDocuments([]);
        setKnowledgeBase([]);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      setAvailableDocuments([]);
      setKnowledgeBase([]);
    } finally {
      setLoadingDocuments(false);
    }
  };

  // Handle document selection
  const handleDocumentSelect = (docId: string) => {
    const documentToSelect = availableDocuments.find(d => d.id === docId);
    if (!documentToSelect) return;

    setNewBot(prev => {
      // If document is already selected by ID, remove it
      if (prev.documentIds.includes(docId)) {
        return {
          ...prev,
          documentIds: prev.documentIds.filter(id => id !== docId)
        };
      }

      // Check if a document with the same name is already selected
      const selectedDocs = prev.documentIds
        .map(id => availableDocuments.find(d => d.id === id))
        .filter(Boolean);

      const duplicateName = selectedDocs.some(doc => doc.name === documentToSelect.name);

      if (duplicateName) {
        showToast(`Document "${documentToSelect.name}" is already selected`, 'warning');
        return prev; // Return unchanged state
      }

      // No duplicate name found, add the document
      return {
        ...prev,
        documentIds: [...prev.documentIds, docId]
      };
    });
  };

  // Handle document upload
  const handleDocumentUpload = async (files: FileList) => {
    // FIX: Prevent duplicate uploads if already uploading
    if (isUploadingDocument) {
      console.log('Upload already in progress, skipping...');
      return;
    }
    setIsUploadingDocument(true);
    try {
      for (const file of files) {
        // CHECK FOR DUPLICATES BEFORE UPLOADING
        // 1. Check against newly uploaded documents in this session
        const isDuplicateInNewDocs = newBot.newDocuments.some(
          doc => doc.name.toLowerCase() === file.name.toLowerCase()
        );

        if (isDuplicateInNewDocs) {
          showToast(`File "${file.name}" is already selected`, 'warning');
          continue; // Skip this file and move to next
        }

        // 2. Check against existing documents in the database
        const isDuplicateInAvailable = availableDocuments.some(
          doc => doc.name.toLowerCase() === file.name.toLowerCase()
        );

        if (isDuplicateInAvailable) {
          showToast(`Document "${file.name}" already exists in knowledge base`, 'warning');
          continue; // Skip this file and move to next
        }

        const formData = new FormData();
        formData.append('documents', file);
        
        // Use XMLHttpRequest for progress tracking
        const xhr = new XMLHttpRequest();
        
        await new Promise<void>((resolve, reject) => {
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100);
              // You could add a progress state here if needed
              console.log(`Upload progress: ${progress}%`);
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
              try {
                const data = JSON.parse(xhr.responseText);
                // The API returns { documents: [...] }, so we need to get the first document
                const uploadedDoc = data.documents && data.documents.length > 0 ? data.documents[0] : null;
                
                if (uploadedDoc && uploadedDoc.id) {
                  // FIX: Add uploaded document ID to documentIds (not newDocuments)
                  // This ensures the KB checkbox gets checked and prevents duplicates
                  setNewBot(prev => {
                    // Check if already in documentIds
                    if (prev.documentIds.includes(uploadedDoc.id)) {
                      showToast(`File "${uploadedDoc.name}" is already selected`, 'warning');
                      return prev;
                    }

                    return {
                      ...prev,
                      documentIds: [...prev.documentIds, uploadedDoc.id]
                    };
                  });

                  // Show specific notification for image/SVG files
                  const imageExtensions = ['.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp'];
                  const isImageFile = imageExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
                  if (isImageFile) {
                    showToast(`Image uploaded: ${file.name}`, 'success');
                  } else {
                    showToast(`Document uploaded: ${file.name}`, 'success');
                  }
                }
                resolve();
              } catch (error) {
                console.error('Error parsing response:', error);
                reject(error);
              }
            } else {
              try {
                const errorData = JSON.parse(xhr.responseText);
                console.error('Upload failed:', errorData.error);
                reject(new Error(errorData.error));
              } catch {
                reject(new Error(xhr.statusText));
              }
            }
          });

          xhr.addEventListener('error', () => {
            console.error('Upload error');
            reject(new Error('Network error'));
          });

          xhr.open('POST', '/api/manager/documents');
          xhr.send(formData);
        });
      }
      // Reload documents to update the list
      await loadDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
    } finally {
      setIsUploadingDocument(false);
    }
  };

  // Get file icon based on type
  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-500" />;
      case 'doc':
      case 'docx':
        return <File className="w-5 h-5 text-blue-500" />;
      case 'txt':
        return <FileText className="w-5 h-5 text-gray-500" />;
      default:
        return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  const handleCreateBot = async () => {
    // Validate required fields
    if (!newBot.name.trim()) {
      showToast('Please enter a bot name', 'warning');
      return;
    }

    if (!newBot.description.trim()) {
      showToast('Please enter a bot description', 'warning');
      return;
    }

    // Validate domain format (must be valid https:// URL)
    if (!newBot.domain || newBot.domain.trim() === '') {
      showToast('Please enter a domain URL', 'warning');
      return;
    }

    if (!newBot.domain.startsWith('https://')) {
      showToast('Domain must start with https:// (e.g., https://yoursite.com)', 'warning');
      return;
    }

    // Validate URL format
    try {
      new URL(newBot.domain);
    } catch (urlError) {
      showToast('Please enter a valid URL (e.g., https://yoursite.com)', 'error');
      return;
    }

    try {
      setLoading(true);
      
      // Create bot directly via API (no payment required)
      const response = await fetch('/api/manager/create-bot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newBot.name,
          description: newBot.description,
          domain: newBot.domain,
          status: newBot.status,
          documentIds: newBot.documentIds,
          newDocuments: newBot.newDocuments
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create bot');
      }

      const result = await response.json();
      console.log('Bot created successfully:', result);

      // Close modal and reset form
      setShowCreateModal(false);
      setNewBot({
        name: '',
        description: '',
        domain: '',
        status: 'active'
      });

      // Refresh the bots list
      fetchBots();

      // Show success message
      showToast('Bot created successfully!', 'success');

    } catch (error) {
      console.error('Error creating bot:', error);
      showToast(`Error creating bot: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignUser = async (botId: string, userId: string) => {
    console.log('Assigning user:', { botId, userId });
    setAssigningUser(userId);
    try {
      const response = await fetch('/api/manager/assign-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          botId,
          userId,
          action: 'assign'
        }),
      });

      console.log('Assign user response status:', response.status);
      const responseData = await response.json();
      console.log('Assign user response data:', responseData);

      if (response.ok) {
        // Refresh assignments
        await fetchUsersAndAssignments(botId);
        console.log('User assigned successfully, refreshing assignments');
        
        // Refresh the main bots list to update totalUsers count
        const refreshResponse = await fetch('/api/manager/bots');
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          setBots(refreshData.bots || []);
        }
        
        setSuccessMessage('User assigned successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        console.error('Failed to assign user:', responseData);
      }
    } catch (error) {
      console.error('Error assigning user:', error);
    } finally {
      setAssigningUser(null);
    }
  };

  const handleUnassignUser = async (botId: string, userId: string) => {
    try {
      const response = await fetch('/api/manager/assign-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          botId,
          userId,
          action: 'unassign'
        }),
      });

      if (response.ok) {
        // Refresh assignments
        await fetchUsersAndAssignments(botId);
        
        // Refresh the main bots list to update totalUsers count
        const refreshResponse = await fetch('/api/manager/bots');
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          setBots(refreshData.bots || []);
        }
      } else {
        console.error('Failed to unassign user');
      }
    } catch (error) {
      console.error('Error unassigning user:', error);
    }
  };

  const handleEditBot = async (bot: {id: string; name: string; description: string; domain: string; status: string; documents?: Array<{id: string; name: string; type: string; size: number}>}) => {
    setEditBot({
      id: bot.id,
      name: bot.name,
      description: bot.description,
      domain: bot.domain,
      status: bot.status
    });

    // Load bot's current knowledge documents from the bot object
    if (bot.documents && bot.documents.length > 0) {
      const docIds = bot.documents.map((doc) => doc.id);
      setEditBotKnowledge(docIds);
    } else {
      setEditBotKnowledge([]);
    }

    setShowEditModal(true);
  };

  const handleUpdateBot = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/manager/update-bot', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editBot,
          knowledgeIds: editBotKnowledge
        }),
      });

      if (response.ok) {
        // Refresh the bots list
        const refreshResponse = await fetch('/api/manager/bots');
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          setBots(refreshData.bots || []);
        }
        setShowEditModal(false);
        setEditBot({ id: "", name: "", description: "", domain: "", status: "active" });
        setEditBotKnowledge([]);
      } else {
        const error = await response.json();
        console.error('Failed to update bot:', error.message || 'Unknown error');
      }
    } catch (error) {
      console.error('Error updating bot:', error);
    }
  };

  const handleTestBot = (bot: {id: string; name: string}) => {
    // Navigate to test bot page in manager dashboard (same layout) without page reload
    router.push(`/manager-dashboard/test-bot?botId=${bot.id}`);
  };

  const handleBotSettings = async (bot: any) => {
    // Fetch current bot settings
    try {
      const response = await fetch(`/api/manager/bot/${bot.id}`);
      if (response.ok) {
        const data = await response.json();
        const botData = data.bot || bot;

        setBotSettings({
          id: botData.id,
          name: botData.name,
          maxTokens: botData.maxTokens || 2000,
          temperature: botData.temperature || 0.7,
          responseTime: botData.responseTime || "normal",
          autoSaveConversations: botData.autoSaveConversations !== undefined ? botData.autoSaveConversations : true,
          enableAnalytics: botData.enableAnalytics !== undefined ? botData.enableAnalytics : true
        });
      } else {
        // Fallback to default values
        setBotSettings({
          id: bot.id,
          name: bot.name,
          maxTokens: 2000,
          temperature: 0.7,
          responseTime: "normal",
          autoSaveConversations: true,
          enableAnalytics: true
        });
      }
    } catch (error) {
      console.error('Error fetching bot settings:', error);
      // Fallback to default values
      setBotSettings({
        id: bot.id,
        name: bot.name,
        maxTokens: 2000,
        temperature: 0.7,
        responseTime: "normal",
        autoSaveConversations: true,
        enableAnalytics: true
      });
    }
    setShowSettingsModal(true);
  };

  const handleAssignKnowledge = async (bot: {id: string; name: string}) => {
    setSelectedBotForKnowledge(bot);

    // Fetch current bot's assigned documents
    try {
      const response = await fetch(`/api/manager/bot-documents?botId=${bot.id}`);
      if (response.ok) {
        const data = await response.json();
        const docIds = (data.documents || []).map((doc: any) => doc.documentId);

        // FIX: Only include document IDs that actually exist in current knowledgeBase
        // This prevents showing "X documents selected" when documents were deleted
        const validDocIds = docIds.filter((id: string) =>
          knowledgeBase.some(doc => doc.id === id)
        );

        console.log(`[Assign Knowledge] Bot has ${docIds.length} assigned documents in DB`);
        console.log(`[Assign Knowledge] ${validDocIds.length} of those still exist in knowledge base`);

        setBotKnowledgeIds(validDocIds);
      } else {
        setBotKnowledgeIds([]);
      }
    } catch (error) {
      console.error('Error loading bot documents:', error);
      setBotKnowledgeIds([]);
    }

    setShowKnowledgeModal(true);
  };

  const handleSaveKnowledge = async () => {
    if (!selectedBotForKnowledge) return;

    // Prevent removing all knowledge when 0 files are selected - show custom modal
    if (botKnowledgeIds.length === 0) {
      setShowRemoveKnowledgeConfirmModal(true);
      return;
    }

    // Proceed with saving
    await performSaveKnowledge();
  };

  // Actual save knowledge logic (called after confirmation)
  const performSaveKnowledge = async () => {
    if (!selectedBotForKnowledge) return;

    try {
      const response = await fetch('/api/manager/update-bot', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedBotForKnowledge.id,
          knowledgeIds: botKnowledgeIds
        }),
      });

      if (response.ok) {
        console.log('Knowledge updated successfully');

        const assignedCount = botKnowledgeIds.length;
        const botName = selectedBotForKnowledge.name;
        const botId = selectedBotForKnowledge.id;

        // Refresh bots list to show updated knowledge count
        const refreshResponse = await fetch('/api/manager/bots');
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          setBots(refreshData.bots || []);
        }

        setShowKnowledgeModal(false);
        setSelectedBotForKnowledge(null);
        setBotKnowledgeIds([]);

        // Show success toast
        showToast(`${assignedCount} document(s) assigned to "${botName}" successfully!`, 'success');

        // Show custom modal to ask about training
        setPendingTrainBot({ id: botId, name: botName });
        setShowTrainConfirmModal(true);
      } else {
        const error = await response.json();
        console.error('Failed to update knowledge:', error.message || 'Unknown error');
        showToast('Failed to update knowledge. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error updating knowledge:', error);
      showToast('Network error. Please try again.', 'error');
    }
  };

  // Handle confirm train bot from modal
  const handleConfirmTrainBot = async () => {
    setShowTrainConfirmModal(false);
    if (pendingTrainBot) {
      await handleTrainBot(pendingTrainBot);
      setPendingTrainBot(null);
    }
  };

  // Handle cancel train bot from modal
  const handleCancelTrainBot = () => {
    setShowTrainConfirmModal(false);
    setPendingTrainBot(null);
  };

  // Handle confirm remove knowledge from modal
  const handleConfirmRemoveKnowledge = async () => {
    setShowRemoveKnowledgeConfirmModal(false);
    await performSaveKnowledge();
  };

  // Handle cancel remove knowledge from modal
  const handleCancelRemoveKnowledge = () => {
    setShowRemoveKnowledgeConfirmModal(false);
  };

  const handleTrainBot = async (bot: {id: string; name: string}) => {
    try {
      setTrainingBot(bot.id);

      // Use direct OpenAI training endpoint for bot training
      const response = await fetch('/api/manager/train-bot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          botId: bot.id,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        const docsProcessed = result.summary?.successfulDocuments || result.summary?.totalDocuments || result.documentsProcessed || 0;
        const totalEmbeddings = result.summary?.totalEmbeddings || 0;
        showToast(`Training complete for "${bot.name}" - ${docsProcessed} document(s) processed, ${totalEmbeddings} embeddings created`, 'success');

        // Refresh bots list to show updated training status
        const refreshResponse = await fetch('/api/manager/bots');
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          setBots(refreshData.bots || []);
        }
      } else {
        // Provide detailed error message
        console.error('Training failed:', result);
        const errorMessage = result.error || result.details || 'Training failed. Please check bot has documents assigned.';
        showToast(`Training failed for "${bot.name}": ${errorMessage}`, 'error');
      }
    } catch (error) {
      console.error('Error training bot:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown network error';
      showToast(`Network error while training: ${errorMsg}`, 'error');
    } finally {
      setTrainingBot(null);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/manager/bot-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(botSettings),
      });

      if (response.ok) {
        setShowSettingsModal(false);
        console.log('Bot settings updated successfully');
      } else {
        const error = await response.json();
        console.error('Failed to update bot settings:', error.message || 'Unknown error');
      }
    } catch (error) {
      console.error('Error updating bot settings:', error);
    }
  };

  const handleDeleteBot = (bot: {id: string; name: string}) => {
    // Open confirmation dialog instead of directly deleting
    setDeleteConfirm({
      isOpen: true,
      botId: bot.id,
      botName: bot.name
    });
  };

  const confirmDeleteBot = async () => {
    if (!deleteConfirm) return;

    try {
      const response = await fetch(`/api/manager/delete-bot`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ botId: deleteConfirm.botId }),
      });

      if (response.ok) {
        // Refresh the bots list
        const refreshResponse = await fetch('/api/manager/bots');
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          setBots(refreshData.bots || []);
        }
        showToast(`Bot "${deleteConfirm.botName}" deleted successfully`, 'success');
      } else {
        const error = await response.json();
        showToast(`Failed to delete bot: ${error.message || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleViewConversations = (bot: { id: string; name: string; assignedUsers: string[]; }) => {
    setSelectedBot(bot);
    setShowConversationHistory(true);
    fetchBotConversations(bot.id);
  };

  // Fetch conversations for a specific bot
  const fetchBotConversations = async (botId: string) => {
    setLoadingConversations(true);
    try {
      const response = await fetch(`/api/conversations/bot/${botId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.conversations) {
          setConversations(data.conversations);
        }
      } else {
        console.error('Failed to fetch conversations');
        setConversations([]);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setConversations([]);
    } finally {
      setLoadingConversations(false);
    }
  };

  const getBotConversations = (botId: string) => {
    return conversations.filter(conv => conv.sender === 'user' || conv.sender === 'bot');
  };

  // Group conversations into sessions (conversations that happen within 30 minutes of each other)
  const groupConversationsIntoSessions = (conversations: Array<{
    id: string;
    message: string;
    sender: 'user' | 'bot';
    timestamp: string;
    isTestMessage: boolean;
  }>) => {
    if (conversations.length === 0) return [];

    // Sort conversations by timestamp
    const sortedConversations = [...conversations].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const sessions: Array<{
      id: string;
      messages: Array<{
        id: string;
        message: string;
        sender: 'user' | 'bot';
        timestamp: string;
        isTestMessage: boolean;
      }>;
      startTime: string;
      endTime: string;
      isTestSession: boolean;
      messageCount: number;
    }> = [];

    let currentSession: Array<{
      id: string;
      message: string;
      sender: 'user' | 'bot';
      timestamp: string;
      isTestMessage: boolean;
    }> = [];

    for (let i = 0; i < sortedConversations.length; i++) {
      const currentMessage = sortedConversations[i];
      
      if (currentSession.length === 0) {
        // Start a new session
        currentSession = [currentMessage];
      } else {
        const lastMessage = currentSession[currentSession.length - 1];
        const timeDiff = new Date(currentMessage.timestamp).getTime() - new Date(lastMessage.timestamp).getTime();
        
        // If messages are within 30 minutes, add to current session
        if (timeDiff <= 30 * 60 * 1000) {
          currentSession.push(currentMessage);
        } else {
          // Create a new session
          sessions.push({
            id: `session-${sessions.length + 1}`,
            messages: [...currentSession],
            startTime: currentSession[0].timestamp,
            endTime: currentSession[currentSession.length - 1].timestamp,
            isTestSession: currentSession.some(msg => msg.isTestMessage),
            messageCount: currentSession.length
          });
          currentSession = [currentMessage];
        }
      }
    }

    // Add the last session
    if (currentSession.length > 0) {
      sessions.push({
        id: `session-${sessions.length + 1}`,
        messages: [...currentSession],
        startTime: currentSession[0].timestamp,
        endTime: currentSession[currentSession.length - 1].timestamp,
        isTestSession: currentSession.some(msg => msg.isTestMessage),
        messageCount: currentSession.length
      });
    }

    return sessions;
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString([], { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleConversationClick = (session: {
    id: string;
    messages: Array<{
      id: string;
      message: string;
      sender: 'user' | 'bot';
      timestamp: string;
      isTestMessage: boolean;
    }>;
    startTime: string;
    endTime: string;
    isTestSession: boolean;
    messageCount: number;
  }) => {
    setSelectedConversation(session.messages);
    setShowConversationDetail(true);
  };

  const handleBackToSessions = () => {
    setSelectedConversation(null);
    setShowConversationDetail(false);
  };

  const handleStatusToggle = (botId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    console.log(`Toggling bot ${botId} status from ${currentStatus} to ${newStatus}`);
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen overflow-visible">
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
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#6566F1] to-[#5A5BD9] rounded-xl flex items-center justify-center shadow-lg">
              <Bot className="h-5 w-5 text-white" />
            </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bot Management</h1>
          <p className="text-sm text-gray-600 mt-1">Create, manage, and assign users to your AI chatbots</p>
        </div>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button
            className="bg-[#6566F1] hover:bg-[#5A5BD9] text-white rounded-2xl"
            onClick={() => setShowCreateModal(true)}
          >
              <Plus className="w-4 h-4 mr-2" />
              Create Bot
            </Button>
        </div>
      </div>

      {/* Create Bot Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Create New Bot</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  // Reset document selection when closing modal
                  setNewBot(prev => ({
                    ...prev,
                    documentIds: [],
                    newDocuments: []
                  }));
                  setDocumentSearchTerm('');
                }}
                className="text-gray-900 hover:text-gray-700 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <Label htmlFor="bot-name" className="text-sm font-semibold text-gray-700 block mb-2">
                  Bot Name *
                </Label>
                <Input
                  id="bot-name"
                  value={newBot.name}
                  onChange={(e) => setNewBot({...newBot, name: e.target.value})}
                  placeholder="Enter bot name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-[#6566F1] focus:ring-2 focus:ring-[#6566F1]/20 text-gray-900 placeholder-gray-500"
                />
              </div>
              
              <div>
                <Label htmlFor="bot-description" className="text-sm font-semibold text-gray-700 block mb-1">
                  System Prompt / Bot Instructions *
                </Label>
                <p className="text-xs text-gray-500 mb-2">
                  Define your bot's personality, behavior, and response style. This will guide how the bot interacts with users.
                </p>
                <textarea
                  id="bot-description"
                  value={newBot.description}
                  onChange={(e) => setNewBot({...newBot, description: e.target.value})}
                  placeholder="Example: You are a friendly and professional customer support assistant. Your role is to help users with their questions about our products and services. You should always be polite, concise, and helpful."
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-[#6566F1] focus:ring-2 focus:ring-[#6566F1]/20 text-gray-900 placeholder-gray-500 resize-none"
                />
              </div>
              
              <div>
                <Label htmlFor="bot-domain" className="text-sm font-semibold text-gray-700 block mb-2">
                  Domain *
                </Label>
                <p className="text-xs text-gray-500 mb-1">Must be a full https:// URL (e.g., https://yoursite.com)</p>
                <input
                  id="bot-domain"
                  type="url"
                  pattern="https://.*"
                  value={newBot.domain}
                  onChange={(e) => setNewBot({...newBot, domain: e.target.value})}
                  placeholder="e.g., https://support.yoursite.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-[#6566F1] focus:ring-2 focus:ring-[#6566F1]/20 text-gray-900 placeholder-gray-500"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="bot-status" className="text-sm font-semibold text-gray-700 block mb-2">
                  Initial Status
                </Label>
                <select
                  id="bot-status"
                  value={newBot.status}
                  onChange={(e) => setNewBot({...newBot, status: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-[#6566F1] focus:ring-2 focus:ring-[#6566F1]/20 text-gray-900 bg-white"
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Document Selection */}
              <div>
                <Label className="text-sm font-semibold text-gray-700 block mb-3">
                  Knowledge Base Documents
                </Label>
                <div className="space-y-3">
                  {/* Search Documents */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      value={documentSearchTerm}
                      onChange={(e) => setDocumentSearchTerm(e.target.value)}
                      placeholder="Search documents..."
                      className="pl-10 text-gray-900"
                    />
                  </div>

                  {/* Document List */}
                  <div className="max-h-32 overflow-y-auto border rounded-lg p-2 space-y-2">
                    {console.log('Available documents:', availableDocuments)}
                    {console.log('Search term:', documentSearchTerm)}
                    {loadingDocuments ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="ml-2 text-sm text-gray-500">Loading documents...</span>
                      </div>
                    ) : (() => {
                      const filteredDocs = availableDocuments.filter(doc => 
                        documentSearchTerm === '' || doc.name.toLowerCase().includes(documentSearchTerm.toLowerCase())
                      );
                      const docsToShow = showAllDocuments ? filteredDocs : filteredDocs.slice(0, 3);
                      const hasMore = filteredDocs.length > 3;
                      
                      return (
                        <>
                          {docsToShow.map((doc) => {
                            const isChecked = newBot.documentIds.includes(doc.id);
                            return (
                        <div
                          key={doc.id}
                          className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${
                            isChecked
                              ? 'bg-green-50 border border-green-200 hover:bg-green-100'
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => handleDocumentSelect(doc.id)}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleDocumentSelect(doc.id)}
                            className="rounded"
                          />
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            {getFileIcon(doc.type)}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {doc.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {doc.type.toUpperCase()} • {Math.round(doc.size / 1024)} KB
                              </p>
                            </div>
                          </div>
                          {isChecked && (
                            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                          )}
                        </div>
                            );
                          })}
                          {hasMore && !showAllDocuments && (
                            <button
                              onClick={() => setShowAllDocuments(true)}
                              className="w-full p-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
                            >
                              Show {filteredDocs.length - 3} more documents...
                            </button>
                          )}
                          {hasMore && showAllDocuments && (
                            <button
                              onClick={() => setShowAllDocuments(false)}
                              className="w-full p-2 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
                            >
                              Show less
                            </button>
                          )}
                        </>
                      );
                    })()}
                    {!loadingDocuments && availableDocuments.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No documents available. Upload some documents in the Knowledge Base first.
                      </p>
                    )}
                    {!loadingDocuments && availableDocuments.length > 0 && availableDocuments.filter(doc => 
                        documentSearchTerm === '' || doc.name.toLowerCase().includes(documentSearchTerm.toLowerCase())
                      ).length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No documents match your search.
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
                      <Upload className="w-6 h-6 text-gray-400" />
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
                        {newBot.documentIds.map(docId => {
                          const doc = availableDocuments.find(d => d.id === docId);
                          return doc ? (
                            <div key={docId} className="flex items-center space-x-2 text-xs text-green-700">
                              {getFileIcon(doc.type)}
                              <span>{doc.name}</span>
                            </div>
                          ) : null;
                        })}
                        {newBot.newDocuments.map((doc, index) => (
                          <div key={index} className="flex items-center space-x-2 text-xs text-green-700">
                            {getFileIcon(doc.type)}
                            <span>{doc.name} (new)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  // Reset document selection when closing modal
                  setNewBot(prev => ({
                    ...prev,
                    documentIds: [],
                    newDocuments: []
                  }));
                  setDocumentSearchTerm('');
                }}
                className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateBot}
                disabled={!newBot.name || !newBot.description || !newBot.domain || loading}
                className="px-6 py-2 bg-[#6566F1] hover:bg-[#5A5BD9] text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating...</span>
                  </div>
                ) : (
                  'Create Bot'
                )}
              </Button>
              </div>
            </div>
      </div>
      )}

      {/* Edit Bot Modal */}
      {showEditModal && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && setShowEditModal(false)}
        >
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Edit Bot</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-900 hover:text-gray-700 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateBot} className="space-y-4">
              <div>
                <Label htmlFor="edit-bot-name" className="text-sm font-medium text-gray-700 mb-2 block">
                  Bot Name
                </Label>
                <input
                  id="edit-bot-name"
                  type="text"
                  value={editBot.name}
                  onChange={(e) => setEditBot({ ...editBot, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-[#6566F1] focus:ring-2 focus:ring-[#6566F1]/20 text-gray-900"
                  placeholder="Enter bot name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="edit-bot-domain" className="text-sm font-medium text-gray-700 mb-2 block">
                  Domain
                </Label>
                <p className="text-xs text-gray-500 mb-1">Must be a full https:// URL (e.g., https://yoursite.com)</p>
                <input
                  id="edit-bot-domain"
                  type="url"
                  pattern="https://.*"
                  value={editBot.domain}
                  onChange={(e) => setEditBot({ ...editBot, domain: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-[#6566F1] focus:ring-2 focus:ring-[#6566F1]/20 text-gray-900"
                  placeholder="e.g., https://support.yoursite.com"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="edit-bot-description" className="text-sm font-medium text-gray-700 mb-1 block">
                  System Prompt / Bot Instructions
                </Label>
                <p className="text-xs text-gray-500 mb-2">
                  Define your bot's personality, behavior, and response style. This will guide how the bot interacts with users.
                </p>
                <textarea
                  id="edit-bot-description"
                  value={editBot.description}
                  onChange={(e) => setEditBot({ ...editBot, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-[#6566F1] text-gray-900 resize-none"
                  placeholder="Example: You are a friendly and professional customer support assistant. Your role is to help users with their questions about our products and services. You should always be polite, concise, and helpful."
                  rows={5}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="edit-bot-status" className="text-sm font-medium text-gray-700 mb-2 block">
                  Status
                </Label>
                <select
                  id="edit-bot-status"
                  value={editBot.status}
                  onChange={(e) => setEditBot({ ...editBot, status: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-[#6566F1] text-gray-900"
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Assign Knowledge Base (Optional)
                  </Label>
                  {editBotKnowledge.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setEditBotKnowledge([])}
                      className="text-xs text-red-600 hover:text-red-700 font-medium"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                <div className="border border-gray-300 rounded-xl max-h-40 overflow-y-auto">
                  {knowledgeBase.length === 0 ? (
                    <div className="p-3 text-sm text-gray-500 text-center">
                      No knowledge base documents available
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {knowledgeBase.map((doc) => {
                        const isChecked = editBotKnowledge.includes(doc.id);
                        return (
                          <label
                            key={doc.id}
                            className={`flex items-center space-x-2 p-2 rounded cursor-pointer transition-colors ${
                              isChecked ? 'bg-green-50 hover:bg-green-100' : 'hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEditBotKnowledge([...editBotKnowledge, doc.id]);
                                } else {
                                  setEditBotKnowledge(editBotKnowledge.filter(id => id !== doc.id));
                                }
                              }}
                              className="w-4 h-4 text-[#6566F1] border-gray-300 rounded focus:ring-[#6566F1]"
                            />
                            <span className="text-sm text-gray-700 flex-1">{doc.name}</span>
                            {isChecked && (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            )}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
                {editBotKnowledge.length > 0 ? (
                  <p className="text-xs text-green-600 font-medium mt-1">
                    ✓ {editBotKnowledge.length} document{editBotKnowledge.length > 1 ? 's' : ''} assigned (uncheck to remove)
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">
                    No documents assigned
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="px-6 py-2 bg-[#6566F1] hover:bg-[#5A5BD9] text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Update Bot
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bot Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                <Settings className="w-6 h-6 text-[#6566F1]" />
                <span>Bot Settings - {botSettings.name}</span>
              </h2>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-gray-900 hover:text-gray-700 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleUpdateSettings} className="space-y-6">
              {/* AI Configuration */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">AI Configuration</h3>

                <div>
                  <Label htmlFor="max-tokens" className="text-sm font-medium text-gray-700 mb-2 block">
                    Max Tokens
                  </Label>
                  <Input
                    id="max-tokens"
                    type="number"
                    min="100"
                    max="4000"
                    value={botSettings.maxTokens}
                    onChange={(e) => setBotSettings({ ...botSettings, maxTokens: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-[#6566F1] text-gray-900"
                  />
                  <p className="text-xs text-gray-500 mt-1">Maximum number of tokens for responses (100-4000)</p>
                </div>

                <div>
                  <Label htmlFor="temperature" className="text-sm font-medium text-gray-700 mb-2 block">
                    Temperature: {botSettings.temperature}
                  </Label>
                  <input
                    id="temperature"
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={botSettings.temperature}
                    onChange={(e) => setBotSettings({ ...botSettings, temperature: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>More focused (0)</span>
                    <span>More creative (1)</span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="response-time" className="text-sm font-medium text-gray-700 mb-2 block">
                    Response Time
                  </Label>
                  <select
                    id="response-time"
                    value={botSettings.responseTime}
                    onChange={(e) => setBotSettings({ ...botSettings, responseTime: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-[#6566F1] text-gray-900 bg-white"
                  >
                    <option value="fast">Fast (shorter responses)</option>
                    <option value="normal">Normal (balanced)</option>
                    <option value="detailed">Detailed (longer responses)</option>
                  </select>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Features</h3>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Auto-save Conversations</p>
                    <p className="text-sm text-gray-500">Automatically save all conversations to database</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={botSettings.autoSaveConversations}
                      onChange={(e) => setBotSettings({ ...botSettings, autoSaveConversations: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#6566F1]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6566F1]"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Enable Analytics</p>
                    <p className="text-sm text-gray-500">Track conversation metrics and user engagement</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={botSettings.enableAnalytics}
                      onChange={(e) => setBotSettings({ ...botSettings, enableAnalytics: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#6566F1]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6566F1]"></div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="px-6 py-2 bg-[#6566F1] hover:bg-[#5A5BD9] text-white rounded-xl"
                >
                  Save Settings
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search bots by name or domain..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-gray-300 focus:border-[#6566F1] focus:ring-[#6566F1] rounded-xl h-11 text-gray-900"
          />
        </div>
        <div className="relative w-48" ref={statusDropdownRef}>
          <button
            onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
            className="flex items-center justify-between w-full px-4 py-2 border border-gray-300 rounded-xl focus:border-[#6566F1] focus:ring-2 focus:ring-[#6566F1]/20 bg-white h-11 text-gray-900 font-medium shadow-sm hover:border-gray-400 transition-colors duration-200 text-center"
          >
            <span className="flex items-center space-x-2">
              {(() => {
                const option = statusOptions.find(opt => opt.value === filterStatus);
                const IconComponent = option?.icon;
                return IconComponent ? <IconComponent className="w-4 h-4" /> : null;
              })()}
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
            <div className="absolute z-[9999] mt-2 w-full bg-white/95 backdrop-blur-xl border border-gray-200/80 rounded-2xl shadow-2xl shadow-gray-200/40 ring-2 ring-gray-100/50 overflow-hidden">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setFilterStatus(option.value);
                    setIsStatusDropdownOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-left transition-all duration-200 flex items-center space-x-3 group ${
                    filterStatus === option.value
                      ? 'bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-l-4 border-[#6566F1] text-[#6566F1] font-semibold shadow-sm'
                      : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50/30 hover:text-gray-900'
                  }`}
                >
                  <option.icon className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
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
        
        {/* Quick Stats */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-400 rounded-lg flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Total Bots</p>
                <p className="text-lg font-bold text-blue-600">{filteredBots.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-400 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Total Conversations</p>
                <p className="text-lg font-bold text-green-600">{filteredBots.reduce((sum, bot) => sum + bot.conversations, 0)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-[#F0F0FE] border border-[#E0E0FE] p-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#6566F1] rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Assigned Users</p>
                <p className="text-lg font-bold text-[#4A4BC8]">{filteredBots.reduce((sum, bot) => sum + bot.totalUsers, 0)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-visible">
        {loading ? (
          // Loading skeleton
          Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="border border-gray-300 bg-white rounded-2xl overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-24"></div>
                    </div>
                  </div>
                  <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-3 bg-gray-200 rounded animate-pulse w-full"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
                <div className="flex justify-between items-center pt-2">
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredBots.length === 0 ? (
          // Empty state
          <div className="col-span-full flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No bots found</h3>
            <p className="text-gray-500 text-center mb-6">
              {searchTerm || filterStatus !== 'all' 
                ? 'No bots match your current filters. Try adjusting your search or filters.'
                : 'You haven\'t created any bots yet. Create your first bot to get started.'
              }
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-[#6566F1] hover:bg-[#5A5BD9] text-white rounded-xl px-6 py-2"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Bot
              </Button>
            )}
          </div>
        ) : (
          filteredBots.map((bot) => (
          <Card key={bot.id} className="group relative border border-gray-300 bg-white hover:shadow-xl hover:shadow-[#6566F1]/10 transition-all duration-300 rounded-2xl overflow-visible hover:-translate-y-1 z-10">
            {/* Gradient Background Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#6566F1]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            

            <CardHeader className="pb-4 relative z-10">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#6566F1] to-[#5A5BD9] rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-[#6566F1]/25 transition-shadow duration-300">
                      <Bot className="h-6 w-6 text-white" />
                    </div>
                    {/* Status indicator */}
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full ${
                      bot.status === 'active' ? 'bg-green-500' : 
                      bot.status === 'paused' ? 'bg-yellow-500' : 'bg-gray-400'
                    }`}></div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-lg font-semibold truncate group-hover:text-[#6566F1] transition-colors duration-200">{bot.name}</CardTitle>
                    <p className="text-sm text-gray-500 truncate">{bot.domain}</p>
                  </div>
                </div>
                <div className="relative">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 hover:bg-[#6566F1]/10 hover:text-[#6566F1] transition-colors duration-200"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Button clicked for bot:', bot.id);

                      const rect = e.currentTarget.getBoundingClientRect();
                      const dropdownWidth = 192; // w-48 = 12rem = 192px
                      const viewportWidth = window.innerWidth;

                      // Check if dropdown would overflow right edge
                      let leftPosition = rect.left;
                      if (rect.left + dropdownWidth > viewportWidth - 20) {
                        // Align dropdown to the right edge of the button
                        leftPosition = rect.right - dropdownWidth;
                      }

                      setDropdownPosition({
                        top: rect.bottom + 5,
                        left: leftPosition
                      });

                      setOpenDropdown(openDropdown === bot.id ? null : bot.id);
                    }}
                    title="Bot options"
                  >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4 relative z-10">
              {/* Status and Last Active */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge className={`${getStatusColor(bot.status)} font-medium px-3 py-1`}>
                  {bot.status}
                </Badge>
                </div>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{bot.lastActive}</span>
              </div>

              {/* Metrics Grid */}
                             <div className="grid grid-cols-2 gap-3">
                 <div className="bg-green-50 border border-green-200 p-3 rounded-lg group-hover:bg-green-100 transition-colors duration-200">
                  <div className="flex items-center space-x-2">
                     <div className="w-8 h-8 bg-green-400 rounded-lg flex items-center justify-center">
                       <MessageSquare className="w-4 h-4 text-white" />
                  </div>
                     <div>
                       <p className="text-xs text-gray-600">Conversations</p>
                       <p className="text-lg font-bold text-green-600">{bot.conversations}</p>
                     </div>
                   </div>
                 </div>
                 
                 <div className="bg-[#F0F0FE] border border-[#E0E0FE] p-3 rounded-lg group-hover:bg-[#E8E8FE] transition-colors duration-200">
                  <div className="flex items-center space-x-2">
                     <div className="w-8 h-8 bg-[#6566F1] rounded-lg flex items-center justify-center">
                       <Users className="w-4 h-4 text-white" />
                  </div>
                     <div>
                       <p className="text-xs text-gray-600">Assigned</p>
                       <p className="text-lg font-bold text-[#4A4BC8]">{bot.totalUsers}</p>
                </div>
                   </div>
                </div>

                 <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg group-hover:bg-orange-100 transition-colors duration-200">
                  <div className="flex items-center space-x-2">
                     <div className="w-8 h-8 bg-orange-400 rounded-lg flex items-center justify-center">
                       <FileText className="w-4 h-4 text-white" />
                  </div>
                     <div>
                       <p className="text-xs text-gray-600">Knowledge</p>
                       <p className="text-lg font-bold text-orange-600">{bot.documentsCount || bot.documents?.length || 0}</p>
                </div>
                   </div>
                </div>

                 <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg group-hover:bg-blue-100 transition-colors duration-200">
                  <div className="flex items-center space-x-2">
                     <div className="w-8 h-8 bg-blue-400 rounded-lg flex items-center justify-center">
                       <Globe className="w-4 h-4 text-white" />
                  </div>
                     <div>
                       <p className="text-xs text-gray-600">Webpages</p>
                       <p className="text-lg font-bold text-blue-600">{bot.webpagesCount || 0}</p>
                </div>
                   </div>
                </div>
              </div>

              {/* Description */}
              <div className="pt-2">
                <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{bot.description}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 border-gray-300 hover:bg-[#6566F1]/10 hover:border-[#6566F1] hover:text-[#6566F1] text-gray-700 rounded-xl transition-all duration-200 group/btn"
                  onClick={() => handleViewConversations(bot)}
                >
                  <MessageSquare className="w-4 h-4 mr-2 group-hover/btn:animate-pulse" />
                  Conversations
                </Button>
                <Button 
                  size="sm" 
                  className="flex-1 bg-[#5A5BD9] hover:bg-[#4A4BC8] text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-[#6566F1]/25 group/btn"
                  onClick={() => {
                    setSelectedBot(bot);
                    setShowAssignModal(true);
                    fetchUsersAndAssignments(bot.id);
                  }}
                >
                  <Users className="w-4 h-4 mr-2 group-hover/btn:animate-pulse" />
                  Manage Users
                </Button>
              </div>

              {/* Quick Stats Bar */}
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Created: {new Date(bot.createdAt).toLocaleDateString()}</span>
                  <span>Last: {bot.lastConversation ? new Date(bot.lastConversation).toLocaleDateString() : 'Never'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
        )}
      </div>

      {/* User Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-[#6566F1] flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Manage Bot Users</span>
              </h2>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSuccessMessage(null);
                }}
                className="text-gray-900 hover:text-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Success Message */}
            {successMessage && (
              <div className="mx-6 mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                {successMessage}
              </div>
            )}
            {/* Modal Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Assigned Users */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Assigned Users</h3>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {loadingUsers ? (
                      <div className="text-center py-8 text-gray-500">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto mb-2"></div>
                        Loading...
                      </div>
                    ) : botAssignments.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                        <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        No users assigned to this bot
                      </div>
                    ) : (
                      botAssignments.map((assignment) => (
                        <div key={assignment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            {getStatusIcon(assignment.userStatus)}
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm text-gray-900 truncate">{assignment.userName}</p>
                              <p className="text-xs text-gray-500 truncate">{assignment.userEmail}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                            onClick={() => handleUnassignUser(selectedBot?.id || '', assignment.userId)}
                            className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 flex-shrink-0 ml-3"
                      >
                            <UserMinus className="w-3 h-3 mr-1" />
                            Unassign
                      </Button>
                    </div>
                      ))
                    )}
                </div>
              </div>

              {/* Available Users */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Available Users</h3>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {loadingUsers ? (
                      <div className="text-center py-8 text-gray-500">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto mb-2"></div>
                        Loading...
                      </div>
                    ) : (
                      <>
                        {users.filter(user => !botAssignments.some(assignment => assignment.userId === user.id)).length === 0 ? (
                          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                            <UserPlus className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                            No available users to assign
                          </div>
                        ) : (
                          users.filter(user => !botAssignments.some(assignment => assignment.userId === user.id)).map((user) => (
                            <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="flex items-center space-x-3 flex-1 min-w-0">
                        {getStatusIcon(user.status)}
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-sm text-gray-900 truncate">{user.name}</p>
                                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                                onClick={() => handleAssignUser(selectedBot?.id || '', user.id)}
                                disabled={assigningUser === user.id}
                                className="bg-[#6566F1] hover:bg-[#5A5BD9] text-white disabled:opacity-50 flex-shrink-0 ml-3 min-w-[80px]"
                              >
                                {assigningUser === user.id ? (
                                  <>
                                    <div className="w-3 h-3 mr-1 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                    <span className="text-xs">Assigning...</span>
                                  </>
                                ) : (
                                  <>
                                    <UserPlus className="w-3 h-3 mr-1" />
                                    Assign
                                  </>
                                )}
                      </Button>
                    </div>
                          ))
                        )}
                      </>
                    )}
                </div>
              </div>
            </div>
            </div>

          </div>
        </div>
      )}

      {/* Conversation History Modal */}
      {showConversationHistory && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-4xl mx-4 max-h-[60vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-[#6566F1] flex items-center space-x-2">
              <MessageSquare className="w-5 h-5" />
              <span>Conversation History - {selectedBot?.name}</span>
              </h2>
              <button
                onClick={() => {
                  setShowConversationHistory(false);
                  setShowConversationDetail(false);
                  setSelectedConversation(null);
                }}
                className="text-gray-900 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {!showConversationDetail ? (
              // Conversation Sessions View
          <div className="space-y-4 max-h-96 overflow-y-auto">
                {loadingConversations ? (
                  <div className="text-center py-12 text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6566F1] mx-auto mb-4"></div>
                    <p className="text-sm">Loading conversations...</p>
                  </div>
                ) : groupConversationsIntoSessions(getBotConversations(selectedBot?.id || '')).length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium mb-2">No Conversations Yet</h3>
                    <p className="text-sm">This bot hasn&apos;t had any conversations yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2 pb-24">
                    {groupConversationsIntoSessions(getBotConversations(selectedBot?.id || '')).map((session) => {
                      // Get first user message for title generation
                      const firstUserMessage = session.messages.find(msg => msg.sender === 'user');
                      const lastMessage = session.messages[session.messages.length - 1];
                      
                      // Generate relevant title based on content
                      let conversationTitle = 'Conversation Session';
                      
                      // For now, always show "Bot Testing" for all conversations to test the UI
                      // TODO: Fix the isTestMessage detection logic
                      conversationTitle = 'Bot Testing';
                      
                      return (
                        <div
                          key={session.id}
                          onClick={() => handleConversationClick(session)}
                          className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md hover:border-[#6566F1] transition-all duration-200 cursor-pointer group"
                        >
                  <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <div className="w-6 h-6 bg-gradient-to-br from-[#6566F1] to-[#5A5BD9] rounded-md flex items-center justify-center flex-shrink-0">
                                <MessageSquare className="w-3 h-3 text-white" />
                    </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-semibold text-gray-900 group-hover:text-[#6566F1] transition-colors truncate">
                                  {conversationTitle}
                                </h3>
                                <p className="text-xs text-gray-500">
                                  {formatTime(lastMessage.timestamp)}
                      </p>
                    </div>
                  </div>
                            <div className="flex items-center space-x-2 flex-shrink-0">
                              {session.isTestSession && (
                                <Badge className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1">
                                  Test
                                </Badge>
                              )}
                              <Badge className="bg-[#6566F1] text-white text-xs px-2 py-1">
                                {session.messageCount}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              // Individual Conversation Detail View
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={handleBackToSessions}
                    className="flex items-center space-x-2 text-[#6566F1] hover:text-[#5A5BD9] transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Sessions</span>
                  </button>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-[#6566F1] text-white">
                      {selectedConversation?.length} messages
                    </Badge>
                    {selectedConversation?.some(msg => msg.isTestMessage) && (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        Test Session
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="space-y-3 max-h-96 overflow-y-auto bg-gray-50 rounded-xl p-4">
                  {selectedConversation?.map((message) => (
                    <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender === 'user' 
                          ? 'bg-[#6566F1] text-white' 
                          : 'bg-white text-gray-800 border border-gray-200'
                      }`}>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-xs font-medium">
                            {message.sender === 'user' ? 'You' : 'Bot'}
                          </span>
                          {message.isTestMessage && (
                            <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                              Test
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
            ))}
          </div>
          </div>
            )}
    </div>
        </div>
      )}

      {/* Portal-based Dropdown Menu */}
      {openDropdown && dropdownPosition && typeof window !== 'undefined' && createPortal(
        <>
          {/* Backdrop to close dropdown */}
          <div 
            className="fixed inset-0 z-[9999998]" 
            onClick={() => {
              setOpenDropdown(null);
              setDropdownPosition(null);
            }}
          />
          
          {/* Dropdown Menu */}
          <div 
            className="fixed w-48 bg-white border border-gray-200 shadow-xl rounded-lg z-[9999999]"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left
            }}
          >
            <div className="py-1">
              <button
                onClick={() => {
                  const bot = bots.find(b => b.id === openDropdown);
                  if (bot) {
                    handleViewConversations(bot);
                  }
                  setOpenDropdown(null);
                  setDropdownPosition(null);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                View Conversations
              </button>
              <button
                onClick={() => {
                  const bot = bots.find(b => b.id === openDropdown);
                  if (bot) {
                    setSelectedBot(bot);
                    setShowAssignModal(true);
                    fetchUsersAndAssignments(bot.id);
                  }
                  setOpenDropdown(null);
                  setDropdownPosition(null);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
              >
                <Users className="w-4 h-4 mr-2" />
                Manage Users
              </button>
              <button
                onClick={() => {
                  const bot = bots.find(b => b.id === openDropdown);
                  if (bot) {
                    handleAssignKnowledge(bot);
                  }
                  setOpenDropdown(null);
                  setDropdownPosition(null);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
              >
                <FileText className="w-4 h-4 mr-2" />
                Assign Knowledge
              </button>
              <button
                onClick={() => {
                  const bot = bots.find(b => b.id === openDropdown);
                  if (bot) {
                    handleTrainBot(bot);
                  }
                  setOpenDropdown(null);
                  setDropdownPosition(null);
                }}
                className="w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 flex items-center"
                disabled={trainingBot === openDropdown}
              >
                <Bot className="w-4 h-4 mr-2" />
                {trainingBot === openDropdown ? 'Training...' : 'Train Bot'}
              </button>
              <button
                onClick={() => {
                  const bot = bots.find(b => b.id === openDropdown);
                  if (bot) {
                    handleEditBot(bot);
                  }
                  setOpenDropdown(null);
                  setDropdownPosition(null);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Bot
              </button>
              <button
                onClick={() => {
                  const bot = bots.find(b => b.id === openDropdown);
                  if (bot) {
                    handleTestBot(bot);
                  }
                  setOpenDropdown(null);
                  setDropdownPosition(null);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
              >
                <PlayCircle className="w-4 h-4 mr-2" />
                Test Bot
              </button>
              <button
                onClick={() => {
                  const bot = bots.find(b => b.id === openDropdown);
                  if (bot) {
                    handleBotSettings(bot);
                  }
                  setOpenDropdown(null);
                  setDropdownPosition(null);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </button>
              <div className="border-t border-gray-200 my-1"></div>
              <button
                onClick={() => {
                  const bot = bots.find(b => b.id === openDropdown);
                  if (bot) {
                    handleDeleteBot(bot);
                  }
                  setOpenDropdown(null);
                  setDropdownPosition(null);
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Bot
              </button>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Knowledge Assignment Modal */}
      {showKnowledgeModal && selectedBotForKnowledge && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Assign Knowledge to {selectedBotForKnowledge.name}
              </h2>
              <button
                onClick={() => {
                  setShowKnowledgeModal(false);
                  setSelectedBotForKnowledge(null);
                  setBotKnowledgeIds([]);
                }}
                className="text-gray-900 hover:text-gray-700 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-6">Select knowledge base documents to assign to this bot.</p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Knowledge Base Documents</label>
              <div className="border border-gray-300 rounded-lg max-h-96 overflow-y-auto">
                {knowledgeBase.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500 text-center">
                    No knowledge base documents available
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {knowledgeBase.map((doc) => {
                      const isChecked = botKnowledgeIds.includes(doc.id);
                      return (
                        <label
                          key={doc.id}
                          className={`flex items-center space-x-2 p-2 rounded cursor-pointer transition-colors ${
                            isChecked ? 'bg-green-50 hover:bg-green-100' : 'hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setBotKnowledgeIds([...botKnowledgeIds, doc.id]);
                              } else {
                                setBotKnowledgeIds(botKnowledgeIds.filter(id => id !== doc.id));
                              }
                            }}
                            className="w-4 h-4 text-[#6566F1] border-gray-300 rounded focus:ring-[#6566F1]"
                          />
                          <span className="text-sm text-gray-700 flex-1">{doc.name}</span>
                          {isChecked && (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
              {botKnowledgeIds.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  {botKnowledgeIds.length} document{botKnowledgeIds.length > 1 ? 's' : ''} selected
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setShowKnowledgeModal(false);
                  setSelectedBotForKnowledge(null);
                  setBotKnowledgeIds([]);
                }}
                className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSaveKnowledge}
                className="bg-[#6566F1] hover:bg-[#5A5BD9] text-white px-6 py-2 rounded-xl"
              >
                Save Knowledge
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <ConfirmDialog
          isOpen={deleteConfirm.isOpen}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={confirmDeleteBot}
          title="Delete Bot?"
          message={`Are you sure you want to delete "${deleteConfirm.botName}"? This action cannot be undone. All bot data, conversations, and assignments will be permanently deleted.`}
          confirmText="Delete Bot"
          cancelText="Cancel"
          variant="danger"
        />
      )}

      {/* Train Bot Confirmation Modal */}
      {showTrainConfirmModal && pendingTrainBot && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full">
              <Bot className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
              Train Bot Now?
            </h2>
            <p className="text-gray-600 text-center mb-6">
              Would you like to train the bot &quot;{pendingTrainBot.name}&quot; now with the assigned documents?
            </p>
            <div className="flex space-x-3">
              <Button
                onClick={handleCancelTrainBot}
                variant="outline"
                className="flex-1 py-2.5 rounded-xl border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Later
              </Button>
              <Button
                onClick={handleConfirmTrainBot}
                className="flex-1 py-2.5 rounded-xl bg-[#6566F1] hover:bg-[#5A5BD9] text-white"
              >
                Train Now
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Knowledge Warning Modal */}
      {showRemoveKnowledgeConfirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full">
              <AlertTriangle className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
              Remove All Knowledge?
            </h2>
            <p className="text-gray-600 text-center mb-2">
              You have not selected any documents.
            </p>
            <p className="text-amber-600 text-center text-sm mb-6">
              Saving with 0 documents will remove all knowledge from this bot.
            </p>
            <div className="flex space-x-3">
              <Button
                onClick={handleCancelRemoveKnowledge}
                variant="outline"
                className="flex-1 py-2.5 rounded-xl border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmRemoveKnowledge}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white"
              >
                Remove All
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
