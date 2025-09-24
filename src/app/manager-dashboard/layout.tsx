'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Bot, 
  BarChart3, 
  Settings, 
  CreditCard, 
  HelpCircle,
  PlayCircle,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  MessageSquare,
  Users,
  MessageCircle,
  Home,
  LogOut,
  Shield
} from 'lucide-react';

interface ManagerDashboardLayoutProps {
  children: React.ReactNode;
}

const ManagerDashboardLayout: React.FC<ManagerDashboardLayoutProps> = ({ 
  children
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if user is admin or manager
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // Check role from session
      const userRole = (session.user as { role?: string }).role;
      setIsAdmin(userRole === 'admin');
      setIsManager(userRole === 'manager');
      setLoading(false);
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [session, status, router]);

  // Get the base dashboard path based on user role
  const getDashboardBasePath = () => {
    const userRole = (session?.user as { role?: string })?.role;
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
        { id: 'playground', label: 'Playground', icon: PlayCircle, path: `${basePath}/playground` },
        { id: 'conversations', label: 'Conversations', icon: MessageSquare, path: `${basePath}/conversations` },
        { id: 'human-handoff', label: 'Human Handoff', icon: MessageCircle, path: `${basePath}/human-handoff` },
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

  // Determine active section based on pathname
  const getActiveSection = () => {
    if (pathname === basePath) return 'overview';
    if (pathname.includes('/team-management')) return 'team-management';
    if (pathname.includes('/manager-bots')) return 'manager-bots';
    if (pathname.includes('/playground')) return 'playground';
    if (pathname.includes('/conversations')) return 'conversations';
    if (pathname.includes('/human-handoff')) return 'human-handoff';
    if (pathname.includes('/analytics')) return 'analytics';
    if (pathname.includes('/billing')) return 'billing';
    if (pathname.includes('/test-bot')) return 'manager-bots'; // Test bot is part of manager-bots section
    if (pathname.includes('/bots')) return 'bots';
    if (pathname.includes('/chatbot-analytics')) return 'chatbot-analytics';
    if (pathname.includes('/settings')) return 'settings';
    if (pathname.includes('/help')) return 'help';
    return 'overview';
  };

  const activeSection = getActiveSection();

  // Get the current page title based on pathname
  const getPageTitle = () => {
    if (pathname === basePath) return 'Overview';
    if (pathname.includes('/team-management')) return 'Team Management';
    if (pathname.includes('/manager-bots')) return 'Manager Bots';
    if (pathname.includes('/playground')) return 'Testing Playground';
    if (pathname.includes('/conversations')) return 'Conversations';
    if (pathname.includes('/human-handoff')) return 'Human Handoff';
    if (pathname.includes('/analytics')) return 'Analytics';
    if (pathname.includes('/chatbot-analytics')) return 'Chatbot Analytics';
    if (pathname.includes('/billing')) return 'Billing';
    if (pathname.includes('/test-bot')) return 'Test Bot';
    if (pathname.includes('/bots')) return 'Bots';
    if (pathname.includes('/settings')) return 'Settings';
    if (pathname.includes('/help')) return 'Help';
    return 'Manager Dashboard';
  };

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
        sidebarCollapsed ? 'w-20' : 'w-72'
      }`}>
        {/* Logo */}
        <div className="flex items-center justify-center h-16 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-white">AI</span>
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
            {navItems.map((item) => {
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
                  <Icon className={`w-5 h-5 ${isActive ? 'text-[#6566F1]' : 'text-[#7F82F3]'} flex-shrink-0`} />
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
            <div className="bg-[#6566F1]/10 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-[#6566F1] rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div className="overflow-hidden">
                  <h3 className="text-sm font-semibold text-gray-900 whitespace-nowrap">Manager Access</h3>
                  <p className="text-xs text-gray-600 whitespace-nowrap">Team management & oversight</p>
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
        )}

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

      {/* Manager Top Bar */}
      {isManager && (
        <div className="fixed top-0 right-0 left-72 bg-white border-b border-gray-200 h-16 z-30 transition-all duration-300" style={{ left: sidebarCollapsed ? '80px' : '288px' }}>
          <div className="flex items-center justify-between h-full px-6">
            <h1 className="text-lg font-bold text-gray-900">{getPageTitle()}</h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleNavigation('/')}
                className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`transition-all duration-300 ${isManager ? 'pt-16' : ''}`} style={{ marginLeft: sidebarCollapsed ? '80px' : '288px' }}>
        {children}
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-md z-50 lg:hidden">
          <div className="fixed inset-y-0 left-0 w-72 bg-white">
            <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
              <span className="text-lg font-bold text-gray-900">Menu</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="mt-6 px-4">
              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigation(item.path)}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        isActive
                          ? 'bg-[#6566F1]/10 text-[#6566F1]'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-[#6566F1]' : 'text-[#7F82F3]'} flex-shrink-0`} />
                      <span className="ml-3">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboardLayout;
