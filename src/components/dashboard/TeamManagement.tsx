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
  Loader2
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';

const TeamManagement = () => {
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{id: string; name: string} | null>(null);
  const [newMember, setNewMember] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    countryCode: '+1'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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
  }>>([]);
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
        // Add additional stats for each team member
        const membersWithStats = (data.users || []).map((user: {id: string; name: string; email: string; role: string; status: string; lastLoginAt: string; createdAt: string}) => {
          // Debug: Log user data to see what we're working with
          console.log('User data:', {
            name: user.name,
            status: user.status,
            lastLoginAt: user.lastLoginAt,
            hasLastLogin: !!user.lastLoginAt
          });
          
          // Determine online status based on actual login time
          let onlineStatus: 'online' | 'offline' = 'offline';
          if (user.status === 'accepted' && user.lastLoginAt) {
            const lastLoginTime = new Date(user.lastLoginAt).getTime();
            const now = Date.now();
            const timeDiff = now - lastLoginTime;
            
            console.log('Time calculation:', {
              lastLoginTime: new Date(lastLoginTime).toISOString(),
              now: new Date(now).toISOString(),
              timeDiffMinutes: Math.round(timeDiff / (1000 * 60)),
              willBeOnline: timeDiff < 2 * 60 * 60 * 1000
            });
            
            // Consider online if logged in within the last 2 hours (more realistic for team management)
            if (timeDiff < 2 * 60 * 60 * 1000) {
              onlineStatus = 'online';
            } else {
              onlineStatus = 'offline';
            }
          } else if (user.status === 'accepted' && !user.lastLoginAt) {
            // If user is accepted but never logged in, show as offline
            onlineStatus = 'offline';
          }
          
          const memberData = {
            ...user,
            rating: (4.5 + Math.random() * 0.5).toFixed(1), // Random rating between 4.5-5.0
            totalChats: Math.floor(Math.random() * 50) + 10, // Random total chats
            onlineStatus: onlineStatus,
            specialties: ['Customer Service'], // Default specialty
            currentStatus: user.status === 'accepted' ? 'Available' : (user.status === 'pending' && user.lastLoginAt ? 'Deactivated' : 'Pending invitation'),
            issuesHandled: user.status === 'accepted' ? Math.floor(Math.random() * 30) + 5 : 0, // Random issues handled for accepted users
            botsAssigned: user.status === 'accepted' ? Math.floor(Math.random() * 5) + 1 : 0, // Random bots assigned for accepted users
          };
          
          console.log('Final member data:', {
            name: memberData.name,
            onlineStatus: memberData.onlineStatus,
            status: memberData.status
          });
          
          return memberData;
        });
        setTeamMembers(membersWithStats);
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
        // Refresh team members list
        fetchTeamMembers();
      } else {
        const errorData = await response.json();
        console.error('Failed to send invitation:', errorData.error || 'Unknown error');
        showToast(errorData.error || 'Failed to send invitation', 'error');
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

      {/* Main Content - Full Width Team Members */}
      <Card className="bg-white rounded-2xl shadow-sm border-0">
        <CardHeader className="p-6 pb-4">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-gray-600" />
            <CardTitle className="text-lg font-bold text-gray-900">
              Team Members ({teamMembers.length})
            </CardTitle>
          </div>
          <p className="text-sm text-gray-600">Manage your support team and their assignments.</p>
        </CardHeader>
        <CardContent className="p-6 pt-0">
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
          ) : (
            <div className="space-y-4">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="p-4 rounded-xl border border-gray-200 bg-white hover:border-[#5A5BD8] hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div
                      className="flex items-center space-x-4 flex-1 cursor-pointer"
                      onClick={() => {
                        setSelectedAgent(member.id);
                        setIsDetailModalOpen(true);
                      }}
                    >
                      {/* Avatar */}
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-gray-600">
                          {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                      </div>

                      {/* Member Info */}
                      <div className="space-y-1 flex-1">
                        <h3 className="text-sm font-semibold text-gray-900">{member.name}</h3>
                        <p className="text-xs text-gray-600">{member.email}</p>
                        <div className="flex items-center space-x-2">
                          <Badge className={`text-xs font-medium px-2 py-1 transition-colors duration-200 shadow-sm ${
                            member.onlineStatus === 'online'
                              ? 'bg-green-500 text-white border-green-600'
                              : 'bg-gray-400 text-white border-gray-500'
                          }`}>
                            {member.onlineStatus}
                          </Badge>
                        </div>
                      </div>

                      {/* Performance Stats */}
                      <div className="text-center px-4 border-l border-gray-200">
                        {member.status === 'accepted' ? (
                          <>
                            <div className="flex items-center space-x-1 justify-center">
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              <span className="text-sm font-bold text-gray-900">{typeof member.rating === 'number' ? member.rating.toFixed(1) : member.rating}</span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">{member.totalChats || 0} chats</p>
                          </>
                        ) : (
                          <div className="text-xs text-gray-500 italic">
                            Pending
                          </div>
                        )}
                      </div>

                      {/* Issues Handled */}
                      <div className="text-center px-4 border-l border-gray-200">
                        <div className="flex items-center space-x-1 justify-center">
                          <AlertCircle className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-bold text-gray-900">{member.issuesHandled || 0}</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">Issues</p>
                      </div>

                      {/* Bots Assigned */}
                      <div className="text-center px-4 border-l border-gray-200">
                        <div className="flex items-center space-x-1 justify-center">
                          <Bot className="w-4 h-4 text-purple-600" />
                          <span className="text-sm font-bold text-gray-900">{member.botsAssigned || 0}</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">Bots</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAgent(member.id);
                          setIsDetailModalOpen(true);
                        }}
                        className="p-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 rounded-lg transition-colors duration-200"
                      >
                        <Edit className="w-4 h-4 text-gray-600" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={togglingUser === member.id}
                        onClick={async (e) => {
                          e.stopPropagation();
                          setTogglingUser(member.id);
                          try {
                            const response = await fetch('/api/manager/toggle-user-status', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                userId: member.id,
                                currentStatus: member.status
                              }),
                            });

                            if (response.ok) {
                              const data = await response.json();
                              setTeamMembers(prevMembers =>
                                prevMembers.map(prevMember =>
                                  prevMember.id === member.id
                                    ? { ...prevMember, status: data.newStatus }
                                    : prevMember
                                )
                              );
                              fetchTeamMembers();
                            } else {
                              const errorData = await response.json();
                              showToast(`Failed to toggle user status: ${errorData.error}`, 'error');
                            }
                          } catch (error) {
                            showToast('Network error. Please try again.', 'error');
                          } finally {
                            setTogglingUser(null);
                          }
                        }}
                        className={`p-2 rounded-lg transition-colors duration-200 ${
                          togglingUser === member.id
                            ? 'bg-red-50 text-red-600 border-red-300'
                            : member.status === 'accepted'
                              ? 'hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300'
                              : 'hover:bg-green-50 hover:text-green-600 hover:border-green-300'
                        }`}
                      >
                        {togglingUser === member.id ? (
                          <Loader2 className="w-4 h-4 text-red-600 animate-spin" />
                        ) : member.status === 'accepted' ? (
                          <UserX className="w-4 h-4 text-orange-600" />
                        ) : (
                          <UserCheck2 className="w-4 h-4 text-green-600" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteModal({ id: member.id, name: member.name });
                        }}
                        className="p-2 hover:bg-red-50 hover:text-red-600 hover:border-red-300 rounded-lg transition-colors duration-200"
                      >
                        <Trash2 className="w-4 h-4 text-gray-600" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
              <h2 className="text-xl font-bold text-gray-900">{selectedAgentData.name}</h2>
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedAgent(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Avatar and Basic Info */}
              <div className="flex items-center space-x-4 pb-4 border-b border-gray-200">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-lg font-medium text-gray-600">
                    {selectedAgentData.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
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

              {/* Role */}
              <div>
                <p className="text-sm font-medium text-gray-600">Role</p>
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
                      <span className="text-lg font-bold text-yellow-700">{typeof selectedAgentData.rating === 'number' ? selectedAgentData.rating.toFixed(1) : selectedAgentData.rating}</span>
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
