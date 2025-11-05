'use client';

import React, { useState } from 'react';
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
  MessageSquare
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeSection?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children, 
  activeSection = 'overview' 
}) => {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'bots', label: 'Bots', icon: Bot, path: '/dashboard/bots' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/dashboard/analytics' },
    { id: 'chatbot-analytics', label: 'Chatbot Analytics', icon: MessageSquare, path: '/dashboard/chatbot-analytics' },
    { id: 'account', label: 'Account', icon: Settings, path: '/dashboard/account' },
    { id: 'billing', label: 'Billing', icon: CreditCard, path: '/dashboard/billing' },
    { id: 'help', label: 'Help', icon: HelpCircle, path: '/dashboard/help' },
  ];

  const handleNavigation = (path: string) => {
    router.push(path);
    setMobileMenuOpen(false);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="min-h-screen flex w-full bg-white">
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-md z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:relative z-50 lg:z-auto
        ${sidebarCollapsed ? 'w-20' : 'w-64'} 
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-0 lg:translate-x-0'}
        h-full transition-all duration-300 ease-in-out
        bg-white border-r border-gray-200
      `}>
        <div className="p-6 h-full flex flex-col">
          {/* Logo - Fixed dimensions regardless of collapse state */}
          <div className="flex items-center mb-8">
            <div className="w-8 h-8 bg-[#6566F1] rounded-lg flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-white" />
            </div>
            {!sidebarCollapsed && (
              <span className="ml-3 text-lg font-bold text-gray-900">
                ChatBot Pro
              </span>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {/* Main Section */}
            <div className="mb-6">
              {!sidebarCollapsed && (
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Main
                </h3>
              )}
              <div className="space-y-1">
                {navItems.slice(0, 3).map((item) => {
                  const isActive = item.id === activeSection;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigation(item.path)}
                      className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-700 hover:bg-gray-50"
                      } ${sidebarCollapsed ? 'justify-center' : ''}`}
                    >
                      <item.icon className={`w-5 h-5 flex-shrink-0 ${
                        isActive ? 'text-blue-700' : 'text-[#6566F1]'
                      }`} />
                      {!sidebarCollapsed && (
                        <span className="ml-3">{item.label}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Account Section */}
            <div>
              {!sidebarCollapsed && (
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Account
                </h3>
              )}
              <div className="space-y-1">
                {navItems.slice(3).map((item) => {
                  const isActive = item.id === activeSection;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigation(item.path)}
                      className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-700 hover:bg-gray-50"
                      } ${sidebarCollapsed ? 'justify-center' : ''}`}
                    >
                      <item.icon className={`w-5 h-5 flex-shrink-0 ${
                        isActive ? 'text-blue-700' : 'text-[#6566F1]'
                      }`} />
                      {!sidebarCollapsed && (
                        <span className="ml-3">{item.label}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </nav>

          {/* Sidebar Toggle - At the bottom of sidebar with proper icon */}
          <div className="mt-6">
            <button
              onClick={toggleSidebar}
              className="w-full flex items-center justify-center py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="w-6 h-6 flex-shrink-0" />
              ) : (
                <>
                  <PanelLeftClose className="w-6 h-6 mr-2 flex-shrink-0" />
                  <span>Collapse</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
