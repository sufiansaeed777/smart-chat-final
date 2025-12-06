'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import {
  Users,
  UserPlus,
  Mail,
  Phone,
  Calendar,
  Star,
  Edit,
  Trash2,
  Bot,
  CheckCircle,
  Clock,
  ArrowLeft,
  X,
  UserCheck,
  AlertCircle,
  UserX,
  UserCheck2,
  Loader2,
  MessageSquare
} from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Tooltip } from '@/components/ui/tooltip';

const TeamManagement = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{id: string; name: string} | null>(null);
  const [newMember, setNewMember] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    countryCode: '+1'
  });
  const [editingMember, setEditingMember] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'user'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [togglingUser, setTogglingUser] = useState<string | null>(null);
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  const [teamMembers, setTeamMembers] = useState<Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    status: 'accepted' | 'pending';
    createdAt: string;
    rating: number;
    totalChats: number;
    onlineStatus: 'online' | 'offline';
    specialties: string[];
    currentStatus: string;
    issuesHandled?: number;
    botsAssigned?: number;
    assignedBots?: Array<{ botId: string; botName: string }>;
  }>>([]);
  const [botGroups, setBotGroups] = useState<Array<{
    botId: string;
    botName: string;
    members: Array<{
      id: string;
      name: string;
      email: string;
      role: string;
      status: 'accepted' | 'pending';
      createdAt: string;
      rating?: number;
      totalChats?: number;
      onlineStatus?: 'online' | 'offline';
      issuesHandled?: number;
    }>;
  }>>([]);
  const [viewMode, setViewMode] = useState<'all' | 'byBot'>('all');
  const [loadingMembers, setLoadingMembers] = useState(true);

  // Validation functions
  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'firstName':
        if (!value.trim()) return 'First name is required';
        if (value.trim().length < 2) return 'First name must be at least 2 characters';
        return '';
      
      case 'lastName':
        if (!value.trim()) return 'Last name is required';
        if (value.trim().length < 2) return 'Last name must be at least 2 characters';
        return '';
      
      case 'email':
        if (!value.trim()) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Please enter a valid email address';
        return '';
      
      case 'phone':
        if (!value.trim()) return 'Phone number is required';
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
          return 'Please enter a valid phone number';
        }
        return '';
      
      default:
        return '';
    }
  };

  const handleInputChange = (name: string, value: string) => {
    setNewMember({...newMember, [name]: value});
    const error = validateField(name, value);
    setErrors({...errors, [name]: error});
  };

  const validateForm = (): boolean => {
    const newErrors = {
      firstName: validateField('firstName', newMember.firstName),
      lastName: validateField('lastName', newMember.lastName),
      email: validateField('email', newMember.email),
      phone: validateField('phone', newMember.phone)
    };
    
    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  // Fetch team members from API
  const fetchTeamMembers = async () => {
    try {
      setLoadingMembers(true);
      const response = await fetch('/api/manager/users');
      if (response.ok) {
        const data = await response.json();
        // Add additional stats for each team member - USE REAL DATA FROM API
        const membersWithStats = (data.users || []).map((user: {id: string; name: string; email: string; role: string; status: string; lastLoginAt: string; createdAt: string; assignedBots?: Array<{botId: string; botName: string}>; totalChats?: number; issuesHandled?: number; botsAssigned?: number}) => {
          // Determine online status based on actual login time
          let onlineStatus: 'online' | 'offline' = 'offline';
          if (user.status === 'accepted' && user.lastLoginAt) {
            const lastLoginTime = new Date(user.lastLoginAt).getTime();
            const now = Date.now();
            const timeDiff = now - lastLoginTime;

            // Consider online if logged in within the last 2 hours
            if (timeDiff < 2 * 60 * 60 * 1000) {
              onlineStatus = 'online';
            } else {
              onlineStatus = 'offline';
            }
          }

          const memberData = {
            ...user,
            // REAL data from API - no more random values
            rating: 0, // CSAT not implemented yet - show 0 or N/A
            totalChats: user.totalChats || 0, // Real count from API
            onlineStatus: onlineStatus,
            specialties: ['Customer Service'],
            currentStatus: user.status === 'accepted' ? 'Available' : (user.status === 'pending' && user.lastLoginAt ? 'Deactivated' : 'Pending invitation'),
            issuesHandled: user.issuesHandled || 0, // Real count from API
            botsAssigned: user.botsAssigned || user.assignedBots?.length || 0, // Real count from API
            assignedBots: user.assignedBots || []
          };

          return memberData;
        });
        setTeamMembers(membersWithStats);

        // Process bot groups with stats - USE REAL DATA FROM API
        if (data.botGroups) {
          const groupsWithStats = data.botGroups.map((group: { botId: string; botName: string; members: Array<{ id: string; name: string; email: string; role: string; status: string; lastLoginAt: string; createdAt: string; totalChats?: number; issuesHandled?: number }> }) => ({
            ...group,
            members: group.members.map(member => {
              let onlineStatus: 'online' | 'offline' = 'offline';
              if (member.status === 'accepted' && member.lastLoginAt) {
                const timeDiff = Date.now() - new Date(member.lastLoginAt).getTime();
                if (timeDiff < 2 * 60 * 60 * 1000) onlineStatus = 'online';
              }
              return {
                ...member,
                onlineStatus,
                // REAL data from API - no more random values
                rating: 0, // CSAT not implemented yet
                totalChats: member.totalChats || 0,
                issuesHandled: member.issuesHandled || 0
              };
            })
          }));
          setBotGroups(groupsWithStats);
        }
      } else {
        console.error('Failed to fetch team members');
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoadingMembers(false);
    }
  };

  // Load team members on component mount
  useEffect(() => {
    fetchTeamMembers();
  }, []);

  // Handle query parameter selection
  useEffect(() => {
    const selectId = searchParams.get('select');
    if (selectId && teamMembers.length > 0) {
      setSelectedAgent(selectId);
    }
  }, [searchParams, teamMembers]);

  // Helper function to get status icon and color
  const getStatusIcon = (status: 'accepted' | 'pending') => {
    if (status === 'accepted') {
      return <UserCheck className="w-5 h-5 text-green-600" />;
    } else {
      return <AlertCircle className="w-5 h-5 text-orange-500" />;
    }
  };

  const getStatusColor = (status: 'accepted' | 'pending') => {
    if (status === 'accepted') {
      return "bg-green-100 text-green-800 border-green-200";
    } else {
      return "bg-orange-100 text-orange-800 border-orange-200";
    }
  };

  // Helper function to get online status icon and color
  const getOnlineStatusIcon = (onlineStatus: 'online' | 'offline') => {
    switch (onlineStatus) {
      case 'online':
        return <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>;
      case 'offline':
        return <div className="w-3 h-3 bg-gray-400 rounded-full shadow-sm"></div>;
      default:
        return <div className="w-3 h-3 bg-gray-400 rounded-full shadow-sm"></div>;
    }
  };

  const getOnlineStatusColor = (onlineStatus: 'online' | 'busy' | 'offline') => {
    switch (onlineStatus) {
      case 'online':
        return "bg-green-500 text-white border-green-600";
      case 'busy':
        return "bg-orange-500 text-white border-orange-600";
      case 'offline':
        return "bg-gray-400 text-white border-gray-500";
      default:
        return "bg-gray-400 text-white border-gray-500";
    }
  };

  const getOnlineStatusHoverColor = (onlineStatus: 'online' | 'busy' | 'offline') => {
    switch (onlineStatus) {
      case 'online':
        return "bg-green-600 text-white border-green-700";
      case 'busy':
        return "bg-orange-600 text-white border-orange-700";
      case 'offline':
        return "bg-gray-500 text-white border-gray-600";
      default:
        return "bg-gray-500 text-white border-gray-600";
    }
  };


  const selectedAgentData = selectedAgent ? teamMembers.find(member => member.id === selectedAgent) : null;

  const handleAddMember = async () => {
    if (!validateForm()) {
      return;
    }

    // Check if email already exists in team members
    const emailLower = newMember.email.toLowerCase().trim();
    const existingMember = teamMembers.find(
      member => member.email.toLowerCase().trim() === emailLower
    );

    if (existingMember) {
      setErrors({
        ...errors,
        email: 'This email is already part of the team.'
      });
      showToast(
        `${existingMember.name} (${existingMember.email}) is already a team member.`,
        'error'
      );
      return;
    }

    setIsLoading(true);

    try {
      const fullPhone = `${newMember.countryCode}${newMember.phone}`;
      const response = await fetch('/api/admin/invite-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${newMember.firstName} ${newMember.lastName}`,
          email: newMember.email,
          phone: fullPhone,
          role: 'user'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Invitation sent successfully:', data);
        setIsAddModalOpen(false);
        setNewMember({ firstName: '', lastName: '', email: '', phone: '', countryCode: '+1' });
        setErrors({ firstName: '', lastName: '', email: '', phone: '' });
        showToast('Invitation sent successfully!', 'success');
        // Refresh team members list
        fetchTeamMembers();
      } else {
        const errorData = await response.json();
        console.error('Failed to send invitation:', errorData.error || 'Unknown error');
        const errorMessage = errorData.error || 'Failed to send invitation';
        
        // Check if the error is about duplicate email
        if (errorMessage.toLowerCase().includes('already') || errorMessage.toLowerCase().includes('exists') || errorMessage.toLowerCase().includes('duplicate')) {
          setErrors({
            ...errors,
            email: 'This email is already part of the team.'
          });
          showToast('This member is already part of the team.', 'error');
        } else {
          showToast(errorMessage, 'error');
        }
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      showToast('Network error. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    
    try {
      const response = await fetch('/api/manager/delete-user', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userToDelete.id
        }),
      });

      if (response.ok) {
        console.log('User deleted successfully');
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
        // Refresh team members list
        fetchTeamMembers();
        // Clear selection if deleted user was selected
        if (selectedAgent === userToDelete.id) {
          setSelectedAgent(null);
        }
      } else {
        const errorData = await response.json();
        console.error('Failed to delete user:', errorData.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteModal = (member: {id: string; name: string}) => {
    setUserToDelete(member);
    setIsDeleteModalOpen(true);
  };

  const handleEditClick = () => {
    if (selectedAgentData) {
      const nameParts = selectedAgentData.name.split(' ');
      setEditingMember({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: selectedAgentData.email,
        phone: '', // Phone not available in current data
        role: selectedAgentData.role
      });
      setIsEditMode(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditingMember({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'user'
    });
    setErrors({ firstName: '', lastName: '', email: '', phone: '' });
  };

  const handleSaveEdit = async () => {
    if (!selectedAgent) return;

    // Validate fields
    const newErrors = {
      firstName: validateField('firstName', editingMember.firstName),
      lastName: validateField('lastName', editingMember.lastName),
      email: validateField('email', editingMember.email),
      phone: ''
    };

    setErrors(newErrors);
    if (Object.values(newErrors).some(error => error !== '')) {
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch('/api/manager/update-user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedAgent,
          firstName: editingMember.firstName,
          lastName: editingMember.lastName,
          email: editingMember.email
          // Role is not editable by managers
        }),
      });

      if (response.ok) {
        showToast('User updated successfully!', 'success');
        setIsEditMode(false);
        setEditingMember({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          role: 'user'
        });
        setErrors({ firstName: '', lastName: '', email: '', phone: '' });
        // Refresh team members list
        fetchTeamMembers();
      } else {
        const errorData = await response.json();
        showToast(errorData.error || 'Failed to update user', 'error');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      showToast('Network error. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
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
        <Button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-[#6566F1] hover:bg-[#5A5BD9] text-white rounded-xl px-6 py-3"
        >
          <UserPlus className="w-5 h-5 mr-2" />
          Add New Member
        </Button>
      </div>

      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
        <p className="text-sm text-gray-600 mt-1">Manage your agents, assignments, and team structure.</p>
      </div>

      {/* Main Content - Team Members Table */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-1">Team Members ({teamMembers.length})</h2>
        <p className="text-[#64748b] mb-5">Manage your support team and their assignments.</p>

        <div className="bg-white rounded-xl overflow-hidden shadow-md border border-gray-100">
          {loadingMembers ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto mb-2"></div>
              <p className="text-sm text-gray-500">Loading team members...</p>
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-sm">No team members yet</p>
              <p className="text-xs text-gray-400">Invite users to get started</p>
            </div>
          ) : viewMode === 'byBot' ? (
            /* Grouped by Bot View */
            <div className="space-y-6">
              {botGroups.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Bot className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-sm">No bot assignments yet</p>
                  <p className="text-xs text-gray-400">Assign members to bots to see them grouped here</p>
                </div>
              ) : (
                botGroups.map((group) => (
                  <div key={group.botId} className="border border-gray-200 rounded-xl overflow-hidden">
                    {/* Bot Header */}
                    <div className="bg-gradient-to-r from-[#6566F1] to-[#8B5CF6] px-4 py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                            <Bot className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-white font-semibold">{group.botName}</h3>
                            <p className="text-white/70 text-xs">{group.members.length} member{group.members.length !== 1 ? 's' : ''} assigned</p>
                          </div>
                        </div>
                        <Badge className="bg-white/20 text-white border-white/30 text-xs">
                          {group.members.filter(m => m.onlineStatus === 'online').length} online
                        </Badge>
                      </div>
                    </div>
                    {/* Members under this Bot */}
                    <div className="divide-y divide-gray-100">
                      {group.members.map((member) => (
                        <div
                          key={`${group.botId}-${member.id}`}
                          className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => {
                            setSelectedAgent(member.id);
                            setIsDetailModalOpen(true);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {/* Avatar */}
                              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-medium text-gray-600">
                                  {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </span>
                              </div>
                              {/* Member Info */}
                              <div>
                                <div className="flex items-center space-x-2">
                                  <h4 className="text-sm font-medium text-gray-900">{member.name}</h4>
                                  <div className={`w-2 h-2 rounded-full ${member.onlineStatus === 'online' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                </div>
                                <p className="text-xs text-gray-500">{member.email}</p>
                              </div>
                            </div>
                            {/* Alert Details */}
                            <div className="flex items-center space-x-4">
                              <div className="text-center">
                                <div className="flex items-center space-x-1">
                                  <AlertCircle className="w-3.5 h-3.5 text-blue-600" />
                                  <span className="text-sm font-semibold text-gray-900">{member.issuesHandled || 0}</span>
                                </div>
                                <p className="text-xs text-gray-500">Issues</p>
                              </div>
                              <div className="text-center">
                                <div className="flex items-center space-x-1">
                                  <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                                  <span className="text-sm font-semibold text-gray-900">{member.totalChats || 0}</span>
                                </div>
                                <p className="text-xs text-gray-500">Chats</p>
                              </div>
                              <div className="text-center">
                                <div className="flex items-center space-x-1">
                                  <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" />
                                  <span className="text-sm font-semibold text-gray-900">
                                    {member.rating && Number(member.rating) > 0 ? member.rating : 'N/A'}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500">Rating</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* All Members View - Table Layout */
            <table className="w-full">
              <thead className="bg-[#f8fafc]">
                <tr>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-[#475569]">User</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-[#475569]">Status</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-[#475569]">Conv</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-[#475569]">CSAT</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-[#475569]">Issues</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-[#475569]">Bots</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-[#475569]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.map((member, index) => (
                  <tr
                    key={member.id}
                    className={`border-b border-[#e2e8f0] hover:bg-gray-50 transition-colors ${
                      index === teamMembers.length - 1 ? 'border-b-0' : ''
                    }`}
                  >
                    {/* User Column */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-[42px] h-[42px] bg-[#e2e8f0] rounded-full flex items-center justify-center font-semibold text-[#475569] text-sm flex-shrink-0">
                          {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-[#1e293b]">{member.name}</div>
                          <div className="text-[13px] text-[#64748b]">{member.email}</div>
                          <span className="inline-block mt-1 px-2.5 py-0.5 bg-[#e2e8f0] text-[#475569] text-[11px] rounded-full">
                            {member.onlineStatus}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Status Column */}
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-sm ${
                        member.status === 'accepted'
                          ? 'text-green-600'
                          : member.status === 'pending'
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}>
                        {member.status === 'accepted' ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : member.status === 'pending' ? (
                          <Clock className="w-4 h-4" />
                        ) : (
                          <UserX className="w-4 h-4" />
                        )}
                        <span className="capitalize">{member.status === 'accepted' ? 'active' : member.status}</span>
                      </span>
                    </td>

                    {/* Conversations Column */}
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1.5 text-sm text-[#1e293b]">
                        <MessageSquare className="w-4 h-4 text-blue-500" />
                        {member.totalChats || 0}
                      </span>
                    </td>

                    {/* CSAT Column */}
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1.5 text-sm text-[#1e293b]">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        {member.rating && member.rating > 0
                          ? (typeof member.rating === 'number' ? member.rating.toFixed(1) : member.rating)
                          : 'N/A'}
                      </span>
                    </td>

                    {/* Issues Column */}
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1.5 text-sm text-[#1e293b]">
                        <AlertCircle className="w-4 h-4 text-orange-500" />
                        {member.issuesHandled || 0}
                      </span>
                    </td>

                    {/* Bots Column */}
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1.5 text-sm text-[#1e293b]">
                        <Bot className="w-4 h-4 text-purple-500" />
                        {member.botsAssigned || 0}
                      </span>
                    </td>

                    {/* Actions Column */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        {/* Edit Button */}
                        <button
                          onClick={() => {
                            setSelectedAgent(member.id);
                            setIsDetailModalOpen(true);
                          }}
                          className="w-[34px] h-[34px] rounded-lg border border-[#e2e8f0] bg-white flex items-center justify-center hover:bg-[#f1f5f9] transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 text-gray-500" />
                        </button>

                        {/* View/Toggle Button */}
                        <button
                          disabled={togglingUser === member.id}
                          onClick={async () => {
                            setTogglingUser(member.id);
                            try {
                              const response = await fetch('/api/manager/toggle-user-status', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  userId: member.id,
                                  currentStatus: member.status
                                }),
                              });
                              if (response.ok) {
                                fetchTeamMembers();
                              } else {
                                const errorData = await response.json();
                                showToast(`Failed: ${errorData.error}`, 'error');
                              }
                            } catch {
                              showToast('Network error', 'error');
                            } finally {
                              setTogglingUser(null);
                            }
                          }}
                          className="w-[34px] h-[34px] rounded-lg border border-[#e2e8f0] bg-white flex items-center justify-center hover:bg-[#f1f5f9] transition-colors disabled:opacity-50"
                          title={member.status === 'accepted' ? 'Deactivate' : 'Activate'}
                        >
                          {togglingUser === member.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                          ) : (
                            <UserCheck2 className="w-4 h-4 text-gray-500" />
                          )}
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => openDeleteModal({ id: member.id, name: member.name })}
                          className="w-[34px] h-[34px] rounded-lg border border-[#e2e8f0] bg-white flex items-center justify-center hover:bg-[#f1f5f9] transition-colors hover:border-red-200 hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add New Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Add New Member</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-6">Add a new team member to your customer support team.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                <input
                  type="text"
                  value={newMember.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6566F1] focus:border-transparent text-gray-900 ${
                    errors.firstName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter first name"
                />
                {errors.firstName && (
                  <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                <input
                  type="text"
                  value={newMember.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6566F1] focus:border-transparent text-gray-900 ${
                    errors.lastName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter last name"
                />
                {errors.lastName && (
                  <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={newMember.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6566F1] focus:border-transparent text-gray-900 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter email address"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <div className="flex space-x-2">
                  <select
                    value={newMember.countryCode}
                    onChange={(e) => setNewMember({...newMember, countryCode: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6566F1] focus:border-transparent text-gray-900"
                  >
                    <option value="+1">+1 (US/CA)</option>
                    <option value="+44">+44 (UK)</option>
                    <option value="+91">+91 (IN)</option>
                    <option value="+61">+61 (AU)</option>
                    <option value="+86">+86 (CN)</option>
                    <option value="+49">+49 (DE)</option>
                    <option value="+33">+33 (FR)</option>
                    <option value="+81">+81 (JP)</option>
                    <option value="+82">+82 (KR)</option>
                    <option value="+92">+92 (PK)</option>
                    <option value="+880">+880 (BD)</option>
                    <option value="+971">+971 (AE)</option>
                    <option value="+966">+966 (SA)</option>
                  </select>
                  <input
                    type="tel"
                    value={newMember.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6566F1] focus:border-transparent text-gray-900 ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter phone number"
                  />
                </div>
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setNewMember({ firstName: '', lastName: '', email: '', phone: '', countryCode: '+1' });
                  setErrors({ firstName: '', lastName: '', email: '', phone: '' });
                }}
                className="px-4 py-2 text-gray-700 border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddMember}
                disabled={isLoading}
                className="bg-[#6566F1] hover:bg-[#5A5BD9] text-white px-4 py-2 disabled:opacity-50"
              >
                {isLoading ? 'Sending...' : 'Add Member'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Member Detail Modal */}
      {isDetailModalOpen && selectedAgentData && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {isEditMode ? 'Edit Member' : selectedAgentData.name}
              </h2>
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedAgent(null);
                  setIsEditMode(false);
                  setEditingMember({
                    firstName: '',
                    lastName: '',
                    email: '',
                    phone: '',
                    role: 'user'
                  });
                  setErrors({ firstName: '', lastName: '', email: '', phone: '' });
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Avatar and Basic Info */}
              <div className="flex items-center space-x-4 pb-4 border-b border-gray-200">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-medium text-gray-600">
                    {isEditMode
                      ? `${editingMember.firstName[0] || ''}${editingMember.lastName[0] || ''}`.toUpperCase()
                      : selectedAgentData.name.split(' ').map(n => n[0]).join('').toUpperCase()
                    }
                  </span>
                </div>
                <div className="flex-1">
                  {isEditMode ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">First Name</label>
                          <input
                            type="text"
                            value={editingMember.firstName}
                            onChange={(e) => {
                              setEditingMember({...editingMember, firstName: e.target.value});
                              const error = validateField('firstName', e.target.value);
                              setErrors({...errors, firstName: error});
                            }}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6566F1] text-sm ${
                              errors.firstName ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="First name"
                          />
                          {errors.firstName && (
                            <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Last Name</label>
                          <input
                            type="text"
                            value={editingMember.lastName}
                            onChange={(e) => {
                              setEditingMember({...editingMember, lastName: e.target.value});
                              const error = validateField('lastName', e.target.value);
                              setErrors({...errors, lastName: error});
                            }}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6566F1] text-sm ${
                              errors.lastName ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Last name"
                          />
                          {errors.lastName && (
                            <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                        <input
                          type="email"
                          value={editingMember.email}
                          onChange={(e) => {
                            setEditingMember({...editingMember, email: e.target.value});
                            const error = validateField('email', e.target.value);
                            setErrors({...errors, email: error});
                          }}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6566F1] text-sm ${
                            errors.email ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Email address"
                        />
                        {errors.email && (
                          <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold text-gray-900">{selectedAgentData.name}</h3>
                      <p className="text-sm text-gray-600">{selectedAgentData.email}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        {getOnlineStatusIcon(selectedAgentData.onlineStatus)}
                        <Badge className={`text-xs font-medium px-2 py-1 ${
                          selectedAgentData.onlineStatus === 'online'
                            ? 'bg-green-500 text-white border-green-600'
                            : 'bg-gray-400 text-white border-gray-500'
                        }`}>
                          {selectedAgentData.onlineStatus}
                        </Badge>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Issues Handled</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">{selectedAgentData.issuesHandled || 0}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Bot className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-purple-900">Bots Assigned</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-900">{selectedAgentData.botsAssigned || 0}</p>
                </div>
              </div>

              {/* Role - Read-only, cannot be changed by manager */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Role</label>
                <p className="text-gray-900 capitalize">{selectedAgentData.role}</p>
              </div>

              {/* Contact Info */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-900">{selectedAgentData.email}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-900">
                    {selectedAgentData.status === 'accepted' ? 'Joined' : 'Invited'} {new Date(selectedAgentData.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Performance */}
              {selectedAgentData.status === 'accepted' ? (
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="flex items-center space-x-1">
                      <Star className="w-5 h-5 text-yellow-500 fill-current" />
                      <span className="text-lg font-bold text-yellow-700">
                        {selectedAgentData.rating && selectedAgentData.rating > 0
                          ? (typeof selectedAgentData.rating === 'number' ? selectedAgentData.rating.toFixed(1) : selectedAgentData.rating)
                          : 'N/A'}
                      </span>
                      <span className="text-sm text-yellow-600">rating</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>{selectedAgentData.totalChats} total chats</span>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Performance metrics will be available after invitation is accepted</span>
                  </div>
                </div>
              )}

              {/* Specialties */}
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Specialties</p>
                <div className="flex flex-wrap gap-2">
                  {selectedAgentData.specialties.map((specialty, index) => (
                    <Badge key={index} className="text-xs bg-gray-100 text-gray-600">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Current Status */}
              <div>
                <p className="text-sm font-medium text-gray-600">Current Status</p>
                <p className="text-gray-900">{selectedAgentData.currentStatus}</p>
              </div>

              {/* Status-specific information */}
              {selectedAgentData.status === 'pending' && !selectedAgentData.onlineStatus && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                    <p className="text-sm font-medium text-orange-800">Pending Invitation</p>
                  </div>
                  <p className="text-xs text-orange-700 mt-1">
                    This user has been invited but hasn&apos;t accepted the invitation yet.
                  </p>
                </div>
              )}

              {selectedAgentData.status === 'accepted' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <UserCheck className="w-5 h-5 text-green-600" />
                    <p className="text-sm font-medium text-green-800">Active Member</p>
                  </div>
                  <p className="text-xs text-green-700 mt-1">
                    This user has accepted their invitation and can now access the system.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
              {isEditMode ? (
                <>
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className="px-4 py-2 text-gray-700 border-gray-300 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveEdit}
                    disabled={isSaving}
                    className="bg-[#6566F1] hover:bg-[#5A5BD9] text-white px-4 py-2 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={handleEditClick}
                    className="px-4 py-2 text-gray-700 border-gray-300 hover:bg-gray-50"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      setSelectedAgent(null);
                    }}
                    className="px-4 py-2 text-gray-700 border-gray-300 hover:bg-gray-50"
                  >
                    Close
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && userToDelete && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Delete User</h2>
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setUserToDelete(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Are you sure you want to delete this user?</p>
                  <p className="text-sm text-gray-600">This action cannot be undone.</p>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">User:</span> {userToDelete.name}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  This will permanently remove the user and all their data from the system.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setUserToDelete(null);
                }}
                className="px-4 py-2 text-gray-700 border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteUser}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete User'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import { ToastProvider } from '@/components/ui/toast';

const TeamManagementWithToast = () => {
  return (
    <ToastProvider>
      <TeamManagement />
    </ToastProvider>
  );
};

export default TeamManagementWithToast;
