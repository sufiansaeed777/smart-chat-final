'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  MoreVertical,
  UserPlus,
  Shield,
  UserCheck,
  UserX,
  Eye,
  Edit,
  Trash2,
  Filter,
  Download,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown
} from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'manager' | 'user';
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  lastLoginAt: string;
  isEmailVerified: boolean;
  phone?: string;
  avatar?: string;
}

const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [emailVerifiedFilter, setEmailVerifiedFilter] = useState<string>('all');
  const [lastLoginFilter, setLastLoginFilter] = useState<string>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUserForView, setSelectedUserForView] = useState<User | null>(null);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<{ id: string; email: string; name: string } | null>(null);
  const [editingUser, setEditingUser] = useState<Partial<User>>({});
  const [updating, setUpdating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'user' as 'admin' | 'manager' | 'user',
    password: '',
    status: 'active' as 'active' | 'inactive' | 'pending',
    isEmailVerified: false
  });

  // Sorting state
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // Handle Escape key to close modals
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showViewModal) {
          setShowViewModal(false);
          setSelectedUserForView(null);
        }
        if (showEditModal) {
          setShowEditModal(false);
          setSelectedUserForEdit(null);
          setEditingUser({});
        }
        if (showDeleteModal) {
          setShowDeleteModal(false);
          setUserToDelete(null);
        }
      }
    };

    if (showViewModal || showEditModal || showDeleteModal) {
      window.addEventListener('keydown', handleEscape);
      return () => {
        window.removeEventListener('keydown', handleEscape);
      };
    }
  }, [showViewModal, showEditModal, showDeleteModal]);

  // Fetch users function
  const loadUsers = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) setLoading(true);
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else {
        console.error('Failed to load users');
        if (isInitialLoad) setUsers([]);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      if (isInitialLoad) setUsers([]);
    } finally {
      if (isInitialLoad) setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadUsers(true);
  }, []);

  // Auto-refresh every 30 seconds for live updates
  useEffect(() => {
    const interval = setInterval(() => {
      loadUsers(false);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleDeleteUser = (user: User) => {
    setUserToDelete({
      id: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`
    });
    setShowDeleteModal(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    setDeleting(userToDelete.id);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userToDelete.id })
      });

      if (response.ok) {
        setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
        setShowDeleteModal(false);
        setUserToDelete(null);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user');
      }
    } catch (error: any) {
      console.error('Error deleting user:', error);
      alert(error.message || 'Failed to delete user. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const handleViewUser = (user: User) => {
    setSelectedUserForView(user);
    setShowViewModal(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUserForEdit(user);
    setEditingUser({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      status: user.status,
      password: ''
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUserForEdit) return;

    // Validate first name and last name
    if (editingUser.firstName && editingUser.firstName.trim() === '') {
      alert('First name cannot be empty');
      return;
    }
    if (editingUser.lastName && editingUser.lastName.trim() === '') {
      alert('Last name cannot be empty');
      return;
    }

    // Validate email if changed
    if (editingUser.email && editingUser.email !== selectedUserForEdit.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editingUser.email)) {
        alert('Please enter a valid email address');
      return;
      }
    }

    // Prepare updates - only include fields that have changed
    const updates: Partial<User> = {};
    if (editingUser.firstName && editingUser.firstName !== selectedUserForEdit.firstName) {
      updates.firstName = editingUser.firstName;
    }
    if (editingUser.lastName && editingUser.lastName !== selectedUserForEdit.lastName) {
      updates.lastName = editingUser.lastName;
    }
    if (editingUser.email && editingUser.email !== selectedUserForEdit.email) {
      updates.email = editingUser.email;
    }
    if (editingUser.status && editingUser.status !== selectedUserForEdit.status) {
      updates.status = editingUser.status;
    }
    if (editingUser.role && editingUser.role !== selectedUserForEdit.role) {
      updates.role = editingUser.role;
    }
    if (editingUser.isEmailVerified !== undefined && editingUser.isEmailVerified !== selectedUserForEdit.isEmailVerified) {
      updates.isEmailVerified = editingUser.isEmailVerified;
    }
    // Only include password if it's been entered
    if (editingUser.password && editingUser.password.trim() !== '') {
      updates.password = editingUser.password;
    }

    if (Object.keys(updates).length === 0) {
      alert('No changes to save');
      return;
    }

    setUpdating(true);
    try {
      await updateUser(selectedUserForEdit.id, updates);
      setShowEditModal(false);
      setSelectedUserForEdit(null);
      setEditingUser({});
    } catch (error: any) {
      console.error('Error updating user:', error);
      alert(error.message || 'Failed to update user. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const updateUser = async (userId: string, updates: Partial<User>) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, updates })
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
        // Refresh the user list to get updated data
        const usersResponse = await fetch('/api/admin/users');
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          setUsers(usersData.users);
        }
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const handleAddUser = async () => {
    if (!newUser.email || !newUser.firstName || !newUser.lastName) {
      alert('Please fill in all required fields (Email, First Name, Last Name)');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });

      if (response.ok) {
        const data = await response.json();
        alert(`User created successfully!${data.defaultPassword ? `\n\nDefault password: ${data.defaultPassword}\n\nPlease share this with the user.` : ''}`);
        setShowCreateModal(false);
        setNewUser({ email: '', firstName: '', lastName: '', role: 'user', password: '', status: 'active', isEmailVerified: false });
        // Refresh user list
        const usersResponse = await fetch('/api/admin/users');
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          setUsers(usersData.users);
        }
      } else {
        const error = await response.json();
        alert(`Failed to create user: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Failed to create user. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleExport = () => {
    const csv = [
      ['Email', 'First Name', 'Last Name', 'Role', 'Status', 'Email Verified', 'Created At', 'Last Login'].join(','),
      ...users.map(u => [u.email, u.firstName, u.lastName, u.role, u.status, u.isEmailVerified, u.createdAt, u.lastLoginAt].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Handle column sort
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  // Get sort icon for column header
  const getSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ChevronsUpDown className="w-3 h-3 ml-1 text-gray-400" />;
    }
    return sortDirection === 'asc'
      ? <ChevronUp className="w-3 h-3 ml-1 text-[#6566F1]" />
      : <ChevronDown className="w-3 h-3 ml-1 text-[#6566F1]" />;
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;

    // Email Verified filter
    let matchesEmailVerified = true;
    if (emailVerifiedFilter === 'verified') {
      matchesEmailVerified = user.isEmailVerified === true;
    } else if (emailVerifiedFilter === 'unverified') {
      matchesEmailVerified = user.isEmailVerified === false;
    }

    // Last Login filter
    let matchesLastLogin = true;
    if (lastLoginFilter !== 'all') {
      const now = new Date();
      const loginDate = user.lastLoginAt === 'Never' ? null : new Date(user.lastLoginAt);

      if (lastLoginFilter === 'never') {
        matchesLastLogin = user.lastLoginAt === 'Never' || !loginDate;
      } else if (lastLoginFilter === 'today') {
        if (!loginDate) {
          matchesLastLogin = false;
        } else {
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          matchesLastLogin = loginDate >= today;
        }
      } else if (lastLoginFilter === 'week') {
        if (!loginDate) {
          matchesLastLogin = false;
        } else {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesLastLogin = loginDate >= weekAgo;
        }
      } else if (lastLoginFilter === 'month') {
        if (!loginDate) {
          matchesLastLogin = false;
        } else {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesLastLogin = loginDate >= monthAgo;
        }
      }
    }

    return matchesSearch && matchesRole && matchesStatus && matchesEmailVerified && matchesLastLogin;
  });

  // Sort users
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (!sortColumn) return 0;

    let aValue: string | boolean | Date;
    let bValue: string | boolean | Date;

    switch (sortColumn) {
      case 'role':
        aValue = a.role;
        bValue = b.role;
        break;
      case 'status':
        aValue = a.status;
        bValue = b.status;
        break;
      case 'emailVerified':
        aValue = a.isEmailVerified;
        bValue = b.isEmailVerified;
        break;
      case 'lastLogin':
        aValue = a.lastLoginAt === 'Never' ? new Date(0) : new Date(a.lastLoginAt);
        bValue = b.lastLoginAt === 'Never' ? new Date(0) : new Date(b.lastLoginAt);
        break;
      default:
        return 0;
    }

    if (typeof aValue === 'boolean') {
      return sortDirection === 'asc'
        ? (aValue === bValue ? 0 : aValue ? -1 : 1)
        : (aValue === bValue ? 0 : aValue ? 1 : -1);
    }

    if (aValue instanceof Date && bValue instanceof Date) {
      return sortDirection === 'asc'
        ? aValue.getTime() - bValue.getTime()
        : bValue.getTime() - aValue.getTime();
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return 0;
  });

  // Pagination calculations
  const totalPages = Math.ceil(sortedUsers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedUsers = sortedUsers.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter, emailVerifiedFilter, lastLoginFilter]);

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'manager': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'user': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-3 h-3 flex-shrink-0" />;
      case 'inactive': return <XCircle className="w-3 h-3 flex-shrink-0" />;
      case 'pending': return <Clock className="w-3 h-3 flex-shrink-0" />;
      default: return <Clock className="w-3 h-3 flex-shrink-0" />;
    }
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border-0">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
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
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">Manage users and their permissions across the platform</p>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={handleExport} className="flex items-center space-x-2 bg-white text-gray-700 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
            <Download className="w-5 h-5" />
            <span>Export</span>
          </button>
          <button onClick={() => setShowCreateModal(true)} className="flex items-center space-x-2 bg-[#6566F1] text-white px-4 py-2 rounded-xl hover:bg-[#5A5BD9] transition-colors shadow-lg">
            <UserPlus className="w-5 h-5" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border-0 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">{users.length}</p>
              <p className="text-sm text-blue-600 flex items-center mt-1">
                <TrendingUp className="w-4 h-4 mr-1" />
                All registered
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border-0 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-3xl font-bold text-gray-900">{users.filter(u => u.status === 'active').length}</p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <CheckCircle className="w-4 h-4 mr-1" />
                {users.length > 0 ? Math.round((users.filter(u => u.status === 'active').length / users.length) * 100) : 0}% of total
              </p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border-0 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Approval</p>
              <p className="text-3xl font-bold text-gray-900">{users.filter(u => !u.isEmailVerified || u.status === 'pending').length}</p>
              <p className="text-sm text-purple-600 flex items-center mt-1">
                <Clock className="w-4 h-4 mr-1" />
                Awaiting approval
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border-0 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Users</p>
              <p className="text-3xl font-bold text-gray-900">{users.filter(u => u.status === 'pending').length}</p>
              <p className="text-sm text-yellow-600 flex items-center mt-1">
                <Clock className="w-4 h-4 mr-1" />
                Awaiting verification
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center">
              <UserX className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border-0 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Verified Users</p>
              <p className="text-3xl font-bold text-gray-900">{users.filter(u => u.isEmailVerified).length}</p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <CheckCircle className="w-4 h-4 mr-1" />
                Email verified
              </p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border-0">
        <div className="flex flex-col gap-4">
          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6566F1] focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
              />
            </div>
          </div>
          {/* Filter Row */}
          <div className="flex flex-wrap gap-3">
            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6566F1] focus:border-transparent bg-white text-gray-900 text-sm"
            >
              <option value="all" className="text-gray-900">All Roles</option>
              <option value="admin" className="text-gray-900">Admin</option>
              <option value="manager" className="text-gray-900">Manager</option>
              <option value="user" className="text-gray-900">User</option>
            </select>
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6566F1] focus:border-transparent bg-white text-gray-900 text-sm"
            >
              <option value="all" className="text-gray-900">All Status</option>
              <option value="active" className="text-gray-900">Active</option>
              <option value="inactive" className="text-gray-900">Inactive</option>
              <option value="pending" className="text-gray-900">Pending</option>
            </select>
            {/* Email Verified Filter */}
            <select
              value={emailVerifiedFilter}
              onChange={(e) => setEmailVerifiedFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6566F1] focus:border-transparent bg-white text-gray-900 text-sm"
            >
              <option value="all" className="text-gray-900">Email Verified</option>
              <option value="verified" className="text-gray-900">Verified</option>
              <option value="unverified" className="text-gray-900">Unverified</option>
            </select>
            {/* Last Login Filter */}
            <select
              value={lastLoginFilter}
              onChange={(e) => setLastLoginFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6566F1] focus:border-transparent bg-white text-gray-900 text-sm"
            >
              <option value="all" className="text-gray-900">Last Login</option>
              <option value="today" className="text-gray-900">Today</option>
              <option value="week" className="text-gray-900">This Week</option>
              <option value="month" className="text-gray-900">This Month</option>
              <option value="never" className="text-gray-900">Never</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-sm border-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={handleSelectAll}
                    className="w-3 h-3 text-[#6566F1] bg-gray-100 border-gray-300 rounded focus:ring-[#6566F1] focus:ring-2"
                  />
                </th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th
                  className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                  onClick={() => handleSort('role')}
                >
                  <div className="flex items-center">
                    Role
                    {getSortIcon('role')}
                  </div>
                </th>
                <th
                  className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">
                    Status
                    {getSortIcon('status')}
                  </div>
                </th>
                <th
                  className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                  onClick={() => handleSort('emailVerified')}
                >
                  <div className="flex items-center">
                    Email Verified
                    {getSortIcon('emailVerified')}
                  </div>
                </th>
                <th
                  className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                  onClick={() => handleSort('lastLogin')}
                >
                  <div className="flex items-center">
                    Last Login
                    {getSortIcon('lastLogin')}
                  </div>
                </th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {paginatedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                      className="w-3 h-3 text-[#6566F1] bg-gray-100 border-gray-300 rounded focus:ring-[#6566F1] focus:ring-2"
                    />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-br from-[#6566F1] to-[#7F82F3] rounded-lg flex items-center justify-center shadow-sm">
                        <span className="text-white font-semibold text-[10px]">
                          {user.firstName[0]}{user.lastName[0]}
                        </span>
                      </div>
                      <div className="ml-2">
                        <div className="text-xs font-semibold text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-[10px] text-gray-500 flex items-center">
                          <Mail className="w-2.5 h-2.5 mr-0.5" />
                          {user.email}
                        </div>
                        {user.phone && (
                          <div className="text-[10px] text-gray-400 flex items-center">
                            <Phone className="w-2.5 h-2.5 mr-0.5" />
                            {user.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${getRoleBadgeColor(user.role)}`}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border flex items-center w-fit ${getStatusBadgeColor(user.status)}`}>
                      {getStatusIcon(user.status)}
                      <span className="ml-0.5">{user.status.charAt(0).toUpperCase() + user.status.slice(1)}</span>
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                      {user.isEmailVerified ? (
                        <span className="text-green-600 text-[10px] font-medium flex items-center">
                          <CheckCircle className="w-3 h-3 mr-0.5" />
                          Verified
                        </span>
                      ) : (
                        <span className="text-yellow-600 text-[10px] font-medium flex items-center">
                          <Clock className="w-3 h-3 mr-0.5" />
                          Pending
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-500 flex items-center">
                    <Calendar className="w-2.5 h-2.5 mr-0.5" />
                    {user.lastLoginAt}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium">
                    <div className="flex items-center space-x-1">
                      <Tooltip content="View user" position="top">
                      <button
                        onClick={() => handleViewUser(user)}
                          className="text-[#6566F1] hover:text-[#5A5BD9] p-1 rounded-lg hover:bg-[#6566F1]/10 transition-colors"
                      >
                          <Eye className="w-3 h-3" />
                      </button>
                      </Tooltip>
                      <Tooltip content="Edit user" position="top">
                      <button
                        onClick={() => handleEditUser(user)}
                          className="text-gray-600 hover:text-gray-900 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                          <Edit className="w-3 h-3" />
                      </button>
                      </Tooltip>
                      <Tooltip content="Delete user" position="top">
                      <button
                        onClick={() => handleDeleteUser(user)}
                        disabled={deleting === user.id}
                          className="text-red-600 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          <Trash2 className="w-3 h-3" />
                      </button>
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {sortedUsers.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1} to {Math.min(endIndex, sortedUsers.length)} of {sortedUsers.length} users
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
        )}
      </div>

      {sortedUsers.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl shadow-sm border-0">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No users found</h3>
          <p className="text-gray-600 mb-6">Try adjusting your search or filter criteria.</p>
          <button className="bg-[#6566F1] text-white px-6 py-3 rounded-xl hover:bg-[#5A5BD9] transition-colors">
            Add New User
          </button>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Create New User</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#6566F1] focus:border-transparent"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#6566F1] focus:border-transparent"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#6566F1] focus:border-transparent"
                  placeholder="john.doe@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'admin' | 'manager' | 'user' })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#6566F1] focus:border-transparent"
                >
                  <option value="user">User</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={newUser.status}
                    onChange={(e) => setNewUser({ ...newUser, status: e.target.value as 'active' | 'inactive' | 'pending' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#6566F1] focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Verification
                  </label>
                  <select
                    value={newUser.isEmailVerified ? 'verified' : 'unverified'}
                    onChange={(e) => setNewUser({ ...newUser, isEmailVerified: e.target.value === 'verified' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#6566F1] focus:border-transparent"
                  >
                    <option value="verified">Verified</option>
                    <option value="unverified">Unverified</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password (Optional)
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#6566F1] focus:border-transparent"
                  placeholder="Leave blank for auto-generated password"
                />
                <p className="text-xs text-gray-500 mt-1">
                  If left blank, a default password will be generated and displayed after creation
                </p>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddUser}
                  disabled={creating}
                  className="px-6 py-3 bg-[#6566F1] text-white rounded-xl hover:bg-[#5A5BD9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View User Modal */}
      {showViewModal && selectedUserForView && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full mx-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900">User Details</h2>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedUserForView(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Avatar and Basic Info */}
              <div className="flex items-center space-x-3 pb-4 border-b border-gray-200">
                <div className="w-14 h-14 bg-gradient-to-br from-[#6566F1] to-[#7F82F3] rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-semibold text-lg">
                    {selectedUserForView.firstName[0]}{selectedUserForView.lastName[0]}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedUserForView.firstName} {selectedUserForView.lastName}
                  </h3>
                  <p className="text-xs text-gray-600 mt-0.5">{selectedUserForView.email}</p>
                  <div className="flex items-center space-x-2 mt-1.5">
                    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border flex items-center ${getStatusBadgeColor(selectedUserForView.status)}`}>
                      {getStatusIcon(selectedUserForView.status)}
                      <span className="ml-1">{selectedUserForView.status.charAt(0).toUpperCase() + selectedUserForView.status.slice(1)}</span>
                    </span>
                    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getRoleBadgeColor(selectedUserForView.role)}`}>
                      {selectedUserForView.role.charAt(0).toUpperCase() + selectedUserForView.role.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* User Information Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">First Name</label>
                  <p className="text-sm text-gray-900">{selectedUserForView.firstName}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Last Name</label>
                  <p className="text-sm text-gray-900">{selectedUserForView.lastName}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email Address</label>
                  <div className="flex items-center space-x-1.5">
                    <Mail className="w-3.5 h-3.5 text-gray-500" />
                    <p className="text-sm text-gray-900">{selectedUserForView.email}</p>
                  </div>
                </div>
                {selectedUserForView.phone && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Phone Number</label>
                    <div className="flex items-center space-x-1.5">
                      <Phone className="w-3.5 h-3.5 text-gray-500" />
                      <p className="text-sm text-gray-900">{selectedUserForView.phone}</p>
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Role</label>
                  <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border inline-block ${getRoleBadgeColor(selectedUserForView.role)}`}>
                    {selectedUserForView.role.charAt(0).toUpperCase() + selectedUserForView.role.slice(1)}
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Status</label>
                  <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border flex items-center w-fit ${getStatusBadgeColor(selectedUserForView.status)}`}>
                    {getStatusIcon(selectedUserForView.status)}
                    <span className="ml-1">{selectedUserForView.status.charAt(0).toUpperCase() + selectedUserForView.status.slice(1)}</span>
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email Verified</label>
                  <div className="flex items-center space-x-1.5">
                    {selectedUserForView.isEmailVerified ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                        <span className="text-green-600 text-xs font-medium">Verified</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5 text-yellow-600" />
                        <span className="text-yellow-600 text-xs font-medium">Pending</span>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Account Created</label>
                  <div className="flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-500" />
                    <p className="text-sm text-gray-900">
                      {new Date(selectedUserForView.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Last Login</label>
                  <div className="flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-500" />
                    <p className="text-sm text-gray-900">
                      {selectedUserForView.lastLoginAt === 'Never' 
                        ? 'Never' 
                        : new Date(selectedUserForView.lastLoginAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-4 mt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedUserForView(null);
                }}
                className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const userToEdit = selectedUserForView;
                  setShowViewModal(false);
                  setSelectedUserForView(null);
                  handleEditUser(userToEdit);
                }}
                className="px-4 py-2 text-sm bg-[#6566F1] text-white rounded-lg hover:bg-[#5A5BD9] transition-colors"
              >
                Edit User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUserForEdit && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full mx-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900">Edit User</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedUserForEdit(null);
                  setEditingUser({});
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              {/* User Info Display */}
              <div className="flex items-center space-x-3 pb-4 border-b border-gray-200">
                <div className="w-14 h-14 bg-gradient-to-br from-[#6566F1] to-[#7F82F3] rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-semibold text-lg">
                    {selectedUserForEdit.firstName[0]}{selectedUserForEdit.lastName[0]}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedUserForEdit.firstName} {selectedUserForEdit.lastName}
                  </h3>
                  <p className="text-xs text-gray-600 mt-0.5">{selectedUserForEdit.email}</p>
                </div>
              </div>

              {/* Editable Fields */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editingUser.firstName || selectedUserForEdit.firstName}
                      onChange={(e) => setEditingUser({ ...editingUser, firstName: e.target.value })}
                      className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6566F1] focus:border-transparent placeholder:text-gray-400"
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editingUser.lastName || selectedUserForEdit.lastName}
                      onChange={(e) => setEditingUser({ ...editingUser, lastName: e.target.value })}
                      className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6566F1] focus:border-transparent placeholder:text-gray-400"
                      placeholder="Enter last name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={editingUser.email || selectedUserForEdit.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6566F1] focus:border-transparent placeholder:text-gray-400"
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Password (Leave blank to keep current)
                  </label>
                  <input
                    type="password"
                    value={editingUser.password || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                    className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6566F1] focus:border-transparent placeholder:text-gray-400"
                    placeholder="Enter new password"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editingUser.status || selectedUserForEdit.status}
                    onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as 'active' | 'inactive' | 'pending' })}
                    className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6566F1] focus:border-transparent bg-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editingUser.role || selectedUserForEdit.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as 'admin' | 'manager' | 'user' })}
                    className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6566F1] focus:border-transparent bg-white"
                  >
                    <option value="user">User</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Email Verification Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editingUser.isEmailVerified !== undefined ? String(editingUser.isEmailVerified) : String(selectedUserForEdit.isEmailVerified)}
                    onChange={(e) => setEditingUser({ ...editingUser, isEmailVerified: e.target.value === 'true' })}
                    className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6566F1] focus:border-transparent bg-white"
                  >
                    <option value="true">Verified</option>
                    <option value="false">Unverified</option>
                  </select>
                </div>

                {/* Read-only fields for reference */}
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">User Information (Read-only)</p>
                  <div className="grid grid-cols-1 gap-3 text-xs">
                    <div>
                      <label className="block text-gray-500 mb-0.5">User ID</label>
                      <p className="text-gray-900 text-[10px]">{selectedUserForEdit.id}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-4 mt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedUserForEdit(null);
                  setEditingUser({});
                }}
                className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={updating}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateUser}
                disabled={updating}
                className="px-4 py-2 text-sm bg-[#6566F1] text-white rounded-lg hover:bg-[#5A5BD9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? 'Updating...' : 'Update User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900">Delete User</h2>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setUserToDelete(null);
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
                  <p className="text-sm font-semibold text-gray-900">Are you sure you want to delete this user?</p>
                  <p className="text-xs text-gray-600 mt-0.5">This action cannot be undone.</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">Name:</span>
                    <span className="ml-2 text-gray-900">{userToDelete.name}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Email:</span>
                    <span className="ml-2 text-gray-900">{userToDelete.email}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  This will permanently remove the user and all their data from the system.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-4 mt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setUserToDelete(null);
                }}
                className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={deleting === userToDelete.id}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteUser}
                disabled={deleting === userToDelete.id}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting === userToDelete.id ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-xl shadow-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">
              {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  const selectedUsersList = users.filter(u => selectedUsers.includes(u.id));
                  const csv = [
                    ['Email', 'First Name', 'Last Name', 'Role', 'Status'].join(','),
                    ...selectedUsersList.map(u => [u.email, u.firstName, u.lastName, u.role, u.status].join(','))
                  ].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `selected-users-${new Date().toISOString().split('T')[0]}.csv`;
                  a.click();
                  window.URL.revokeObjectURL(url);
                }}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                Export
              </button>
              <button
                onClick={() => {
                  if (confirm(`Activate ${selectedUsers.length} user(s)?`)) {
                    selectedUsers.forEach(userId => updateUser(userId, { status: 'active' }));
                    setSelectedUsers([]);
                  }
                }}
                className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
              >
                Activate
              </button>
              <button
                onClick={() => {
                  if (confirm(`Deactivate ${selectedUsers.length} user(s)?`)) {
                    selectedUsers.forEach(userId => updateUser(userId, { status: 'inactive' }));
                    setSelectedUsers([]);
                  }
                }}
                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;
