'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { 
  LayoutDashboard, 
  Users, 
  Bot, 
  BarChart3, 
  Settings, 
  HelpCircle, 
  CreditCard,
  Database,
  Shield,
  AlertTriangle,
  MessageSquare,
  Activity,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

const AdminDashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const basePath = '/admin-dashboard';

  const getNavItems = (): NavItem[] => [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, path: `${basePath}` },
    { id: 'user-management', label: 'User Management', icon: Users, path: `${basePath}/user-management` },
    { id: 'bots', label: 'Bots', icon: Bot, path: `${basePath}/bots` },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, path: `${basePath}/analytics` },
    { id: 'chatbot-analytics', label: 'Chatbot Analytics', icon: MessageSquare, path: `${basePath}/chatbot-analytics` },
    { id: 'chatbot-issues', label: 'Chatbot Issues', icon: AlertTriangle, path: `${basePath}/chatbot-issues` },
    { id: 'billing-management', label: 'Billing Management', icon: CreditCard, path: `${basePath}/billing-management` },
    // { id: 'database', label: 'Database', icon: Database, path: `${basePath}/database` },
    { id: 'system-health', label: 'System Health', icon: Activity, path: `${basePath}/system-health` },
    { id: 'settings', label: 'Settings', icon: Settings, path: `${basePath}/settings` },
    // { id: 'help', label: 'Help', icon: HelpCircle, path: `${basePath}/help` },
  ];

  const getActiveSection = (pathname: string): string => {
    if (pathname.includes('/user-management')) return 'user-management';
    if (pathname.includes('/bots')) return 'bots';
    if (pathname.includes('/analytics')) return 'analytics';
    if (pathname.includes('/chatbot-analytics')) return 'chatbot-analytics';
    if (pathname.includes('/chatbot-issues')) return 'chatbot-issues';
    if (pathname.includes('/billing-management')) return 'billing-management';
    // if (pathname.includes('/database')) return 'database';
    if (pathname.includes('/system-health')) return 'system-health';
    if (pathname.includes('/settings')) return 'settings';
    // if (pathname.includes('/help')) return 'help';
    return 'overview';
  };

  const navItems = getNavItems();
  const activeSection = getActiveSection(pathname);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#6566F1] to-[#5A5BD9] rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Admin</span>
          </div>
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            {sidebarOpen ? (
              <PanelLeftClose className="w-5 h-5" />
            ) : (
              <PanelLeftOpen className="w-5 h-5" />
            )}
          </button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              
              return (
                <Link
                  key={item.id}
                  href={item.path}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    isActive
                      ? 'bg-[#6566F1] text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 lg:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={toggleSidebar}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <PanelLeftOpen className="w-5 h-5" />
              </button>
              <h1 className="text-lg font-semibold text-gray-900 capitalize">
                {activeSection.replace('-', ' ')}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>System Online</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-md lg:hidden"
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
};

export default AdminDashboardLayout;
