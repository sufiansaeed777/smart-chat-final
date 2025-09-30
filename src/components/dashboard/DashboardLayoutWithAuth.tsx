'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Bot, 
  BarChart3, 
  Settings, 
  CreditCard, 
  HelpCircle,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Zap,
  MessageSquare,
  Users,
  MessageCircle,
  Home,
  LogOut,
  Shield,
  HandHeart
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeSection?: string;
}

const DashboardLayoutWithAuth: React.FC<DashboardLayoutProps> = ({ 
  children, 
  activeSection = 'overview' 
}) => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if user is admin or manager
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // Check if user is verified (additional safety check)
      const isVerified = 'isEmailVerified' in session.user ? session.user.isEmailVerified : true;
      const isActive = 'isActive' in session.user ? session.user.isActive : true;
      
      if (!isVerified || !isActive) {
        router.push('/login?message=Please verify your email before accessing the dashboard');
        return;
      }
      
      // Check role from session
      const userRole = 'role' in session.user ? session.user.role : 'user';
      setIsAdmin(userRole === 'admin');
      setIsManager(userRole === 'manager');
      setLoading(false);
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [session, status, router]);

  // Get the base dashboard path based on user role
  const getDashboardBasePath = () => {
    const userRole = session?.user && 'role' in session.user ? session.user.role : 'user';
    if (userRole === 'admin') return '/admin-dashboard';
    if (userRole === 'manager') return '/manager-dashboard';
    return '/user-dashboard';
  };

  const basePath = getDashboardBasePath();
  
  // Get navigation items based on user role
  const getNavItems = () => {
    if (isManager) {
      return [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard, path: basePath },
        { id: 'team-management', label: 'Team Management', icon: Users, path: `${basePath}/team-management` },
        { id: 'manager-bots', label: 'Manager Bots', icon: Bot, path: `${basePath}/manager-bots` },
        { id: 'human-handoff', label: 'Human Handoff', icon: HandHeart, path: `${basePath}/human-handoff` },
        { id: 'analytics', label: 'Analytics', icon: BarChart3, path: `${basePath}/analytics` },
        { id: 'billing', label: 'Billing', icon: CreditCard, path: `${basePath}/billing` },
      ];
    } else if (isAdmin) {
      return [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard, path: basePath },
        { id: 'bots', label: 'Bots', icon: Bot, path: `${basePath}/bots` },
        { id: 'analytics', label: 'Analytics', icon: BarChart3, path: `${basePath}/analytics` },
        { id: 'chatbot-analytics', label: 'Chatbot Analytics', icon: MessageSquare, path: `${basePath}/chatbot-analytics` },
        { id: 'settings', label: 'Settings', icon: Settings, path: `${basePath}/settings` },
        { id: 'billing', label: 'Billing', icon: CreditCard, path: `${basePath}/billing` },
        { id: 'help', label: 'Help', icon: HelpCircle, path: `${basePath}/help` },
      ];
    } else {
      return [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard, path: basePath },
        { id: 'bots', label: 'Bots', icon: Bot, path: `${basePath}/bots` },
        { id: 'analytics', label: 'Analytics', icon: BarChart3, path: `${basePath}/analytics` },
        { id: 'settings', label: 'Settings', icon: Settings, path: `${basePath}/settings` },
        { id: 'billing', label: 'Billing', icon: CreditCard, path: `${basePath}/billing` },
        { id: 'help', label: 'Help', icon: HelpCircle, path: `${basePath}/help` },
      ];
    }
  };

  const navItems = getNavItems();

  const handleNavigation = (path: string) => {
    router.push(path);
    setMobileMenuOpen(false);
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6566F1] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-40 ${
        sidebarCollapsed ? 'w-20' : 'w-64'
      }`}>
        {/* Logo */}
        <div className="flex items-center justify-center h-16 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-white">AI</span>
            </div>
            <div className={`overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
              <span className="text-lg font-bold text-gray-900 whitespace-nowrap">
                ChatBot Pro
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full flex items-center ${
                    sidebarCollapsed ? 'justify-center px-2' : 'px-3'
                  } py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-blue-700' : 'text-[#6566F1]'} flex-shrink-0`} />
                  <div className={`overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                    <span className="ml-3 whitespace-nowrap">{item.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Manager Access Card */}
        {isManager && (
          <div className={`mt-8 px-3 transition-all duration-300 ${sidebarCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <div className="bg-purple-50 border-l-4 border-purple-600 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div className="overflow-hidden">
                  <h3 className="font-semibold text-gray-900 whitespace-nowrap">Manager Access</h3>
                  <p className="text-sm text-gray-600 whitespace-nowrap">Team management & oversight</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Additional Navigation for Managers */}
        {isManager && (
          <nav className="mt-6 px-3">
            <div className="space-y-1">
              <button
                onClick={() => handleNavigation('/')}
                className={`w-full flex items-center ${
                  sidebarCollapsed ? 'justify-center px-2' : 'px-3'
                } py-2 text-sm font-medium rounded-lg transition-colors text-gray-700 hover:bg-gray-50`}
              >
                <Home className="w-5 h-5 text-[#6566F1] flex-shrink-0" />
                <div className={`overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                  <span className="ml-3 whitespace-nowrap">Home</span>
                </div>
              </button>
              <button
                onClick={handleSignOut}
                className={`w-full flex items-center ${
                  sidebarCollapsed ? 'justify-center px-2' : 'px-3'
                } py-2 text-sm font-medium rounded-lg transition-colors text-gray-700 hover:bg-gray-50`}
              >
                <LogOut className="w-5 h-5 text-[#6566F1] flex-shrink-0" />
                <div className={`overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                  <span className="ml-3 whitespace-nowrap">Logout</span>
                </div>
              </button>
            </div>
          </nav>
        )}

        {/* Sidebar Toggle Button */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center">
          <button
            onClick={toggleSidebar}
            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="w-6 h-6 text-gray-600 flex-shrink-0" />
            ) : (
              <PanelLeftClose className="w-6 h-6 text-gray-600 flex-shrink-0" />
            )}
          </button>
        </div>
      </div>

      {/* Top Header Bar for Managers */}
      {isManager && (
        <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-30 flex items-center justify-between px-6">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gray-200 rounded"></div>
            <h1 className="text-lg font-bold text-gray-900">Manager Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleNavigation('/')}
              className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </button>
            <button
              onClick={() => router.push('/api/auth/signout')}
              className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}

      {/* Top Bar for User Dashboard */}
      {!isManager && !isAdmin && (
        <div className="fixed top-0 right-0 left-0 bg-white border-b border-gray-200 z-40" style={{ marginLeft: sidebarCollapsed ? '80px' : '256px' }}>
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">User Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-[#6566F1] rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || 'U'}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {session?.user?.name || session?.user?.email || 'User'}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'} ${isManager ? 'pt-16' : (!isManager && !isAdmin ? 'pt-16' : '')}`}>
        <div className="min-h-screen">
          {children}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayoutWithAuth;
