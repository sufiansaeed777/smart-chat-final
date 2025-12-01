'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Bot, 
  BarChart3, 
  HelpCircle,
  PanelLeftClose,
  PanelLeftOpen,
  MessageSquare,
  Users,
  MessageCircle,
  Home,
  LogOut,
  User,
  Shield,
  AlertTriangle,
  HandHeart,
  PlayCircle,
  Menu,
  X,
  ArrowLeft
} from 'lucide-react';
import RoleGuard from '@/components/auth/RoleGuard';

interface UserDashboardLayoutProps {
  children: React.ReactNode;
}

const UserDashboardLayout: React.FC<UserDashboardLayoutProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Real data for issue counts
  const [issueCounts, setIssueCounts] = useState({
    total: 0,
    resolved: 0,
    pending: 0
  });

  // Real data for human handoff counts
  const [handoffCounts, setHandoffCounts] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0
  });

  // Fetch stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch issue stats
        const issuesResponse = await fetch('/api/user/issues/stats');
        if (issuesResponse.ok) {
          const issuesData = await issuesResponse.json();
          setIssueCounts(issuesData);
        }

        // Fetch handoff stats
        const handoffResponse = await fetch('/api/user/handoff/stats');
        if (handoffResponse.ok) {
          const handoffData = await handoffResponse.json();
          setHandoffCounts(handoffData);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    if (status === 'authenticated') {
      fetchStats();
    }
  }, [status]);

  // Navigation items for user dashboard
  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, path: '/user-dashboard' },
    { id: 'bots', label: 'My Bots', icon: Bot, path: '/user-dashboard/bots' },
    { id: 'playground', label: 'Playground', icon: PlayCircle, path: '/user-dashboard/playground' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/user-dashboard/analytics' },
    { id: 'conversations', label: 'Conversations', icon: MessageSquare, path: '/user-dashboard/conversations' },
    { 
      id: 'human-handoff', 
      label: 'Human Handoff', 
      icon: HandHeart, 
      path: '/user-dashboard/human-handoff',
      badge: handoffCounts.pending > 0 ? handoffCounts.pending : null
    },
    {
      id: 'issues',
      label: 'Issues',
      icon: AlertTriangle,
      path: '/user-dashboard/issues',
      badge: issueCounts.pending > 0 ? issueCounts.pending : null,
      subtitle: `${issueCounts.resolved}/${issueCounts.total} resolved`
    },
    { id: 'profile', label: 'Profile', icon: User, path: '/user-dashboard/profile' },
    { id: 'help', label: 'Help', icon: HelpCircle, path: '/user-dashboard/help' },
  ];

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const getActiveSection = () => {
    if (pathname === '/user-dashboard') return 'overview';
    if (pathname.includes('/bots')) return 'bots';
    if (pathname.includes('/playground')) return 'playground';
    if (pathname.includes('/analytics')) return 'analytics';
    if (pathname.includes('/conversations')) return 'conversations';
    if (pathname.includes('/human-handoff')) return 'human-handoff';
    if (pathname.includes('/issues')) return 'issues';
    if (pathname.includes('/profile')) return 'profile';
    if (pathname.includes('/help')) return 'help';
    return 'overview';
  };

  const activeSection = getActiveSection();

  const handleNavigation = (path: string) => {
    router.push(path);
    closeMobileMenu(); // Close mobile menu when navigating
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6566F1]"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  return (
    <RoleGuard allowedRoles={['user']}>
      <div className="min-h-screen bg-gray-50">
        {/* Mobile menu overlay */}
        {mobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-md z-40 lg:hidden"
            onClick={closeMobileMenu}
          />
        )}

        {/* Sidebar */}
        <div className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-50 ${
          sidebarCollapsed ? 'w-20' : 'w-72'
        } ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>
        {/* Logo */}
        <div className="flex items-center justify-center h-16 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">AI</span>
            </div>
            <div className={`overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
              <span className="text-base font-bold text-gray-900 whitespace-nowrap">
                ChatBot Pro
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full flex items-center ${
                    sidebarCollapsed ? 'justify-center px-2' : 'px-3'
                  } py-2 text-xs font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-[#6566F1]/10 text-[#6566F1]'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="relative">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-[#6566F1]' : 'text-[#7F82F3]'} flex-shrink-0`} />
                    {item.badge && !sidebarCollapsed && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center text-[10px] font-bold">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <div className={`overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                    <div className="ml-3 flex flex-col items-start">
                      <span className="whitespace-nowrap">{item.label}</span>
                      {item.subtitle && (
                        <span className="text-[10px] text-gray-500 whitespace-nowrap">{item.subtitle}</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </nav>

        {/* User Access Section */}
        <div className={`mt-8 px-3 transition-all duration-300 ${sidebarCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <div className="bg-[#6566F1]/10 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-[#6566F1] rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="overflow-hidden">
                <h3 className="text-sm font-semibold text-gray-900 whitespace-nowrap">User Access</h3>
                <p className="text-xs text-gray-600 whitespace-nowrap">Personal workspace</p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Navigation */}
        <nav className="mt-6 px-3">
          <div className="space-y-1">
            <button
              onClick={() => handleNavigation('/')}
              className={`w-full flex items-center ${
                sidebarCollapsed ? 'justify-center px-2' : 'px-3'
              } py-2 text-xs font-medium rounded-lg transition-colors text-gray-700 hover:bg-gray-50`}
            >
              <Home className="w-5 h-5 text-[#7F82F3] flex-shrink-0" />
              <div className={`overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                <span className="ml-3 whitespace-nowrap">Home</span>
              </div>
            </button>
            <button
              onClick={handleSignOut}
              className={`w-full flex items-center ${
                sidebarCollapsed ? 'justify-center px-2' : 'px-3'
              } py-2 text-xs font-medium rounded-lg transition-colors text-gray-700 hover:bg-gray-50`}
            >
              <LogOut className="w-5 h-5 text-[#7F82F3] flex-shrink-0" />
              <div className={`overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                <span className="ml-3 whitespace-nowrap">Logout</span>
              </div>
            </button>
          </div>
        </nav>

        {/* Sidebar Toggle Button */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
          <button
            onClick={toggleSidebar}
            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-gray-600" />
            ) : (
              <PanelLeftClose className="w-4 h-4 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* User Top Bar */}
      <div className={`fixed top-0 right-0 left-0 bg-white border-b border-gray-200 h-16 z-30 transition-all duration-300 lg:${
        sidebarCollapsed ? 'left-20' : 'left-72'
      }`}>
        <div className="flex items-center justify-between h-full px-4 lg:px-6">
          <div className="flex items-center space-x-4">
            {/* Mobile menu button */}
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            
            {/* Back to Dashboard button - only show if not on main dashboard */}
            {!pathname.endsWith('/user-dashboard') && (
              <button
                onClick={() => handleNavigation('/user-dashboard')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-2 rounded-lg transition-all duration-200"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Back to Dashboard</span>
              </button>
            )}
          </div>
          
          <h1 className="text-lg font-bold text-gray-900">
            {pathname.includes('/playground') ? 'AI Bot Playground' :
             pathname.includes('/bots') ? 'My Bots' :
             pathname.includes('/analytics') ? 'Analytics' :
             pathname.includes('/conversations') ? 'Conversations' :
             pathname.includes('/human-handoff') ? 'Human Handoff' :
             pathname.includes('/issues') ? 'Issues' :
             pathname.includes('/profile') ? 'Profile' :
             pathname.includes('/help') ? 'Help' :
             'User Dashboard'}
          </h1>
          
          <div className="flex items-center space-x-2 lg:space-x-4">
            <button
              onClick={() => handleNavigation('/')}
              className="hidden sm:flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              <Home className="w-4 h-4" />
              <span className="hidden lg:inline">Home</span>
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden lg:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

        {/* Main Content */}
        <div className={`pt-16 transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'
        }`}>
          <div className="min-h-screen">
            {children}
          </div>
        </div>
      </div>
    </RoleGuard>
  );
};

export default UserDashboardLayout;
