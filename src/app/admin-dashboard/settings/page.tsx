'use client';

import React, { useState } from 'react';
import {
  Settings,
  User, 
  Shield, 
  Bell,
  Globe,
  Database,
  Key,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Save,
  RefreshCw
} from 'lucide-react';

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [settings, setSettings] = useState({
    siteName: 'Smart Chat Admin',
    siteDescription: 'AI-powered chatbot platform',
    adminEmail: 'admin@smartchat.com',
    timezone: 'UTC',
    language: 'en',
    notifications: {
      email: true,
      push: true,
      sms: false
    },
    security: {
      twoFactor: true,
      sessionTimeout: 30,
      passwordPolicy: 'strong'
    }
  });

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'integrations', label: 'Integrations', icon: Globe }
  ];

  const handleSave = async () => {
    setSaving(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // In a real implementation, you would save to an API:
      // const response = await fetch('/api/admin/settings', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(settings)
      // });

      console.log('Settings saved:', settings);

      // Show success message
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);

    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-green-800 font-semibold">Settings saved successfully!</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage system configuration and preferences</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center space-x-2 bg-[#6566F1] text-white px-4 py-2 rounded-xl hover:bg-[#5A5BD9] transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border-0 p-4">
            <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-colors ${
                    activeTab === tab.id
                        ? 'bg-[#6566F1] text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                    <Icon className="w-5 h-5 mr-3" />
                    {tab.label}
                </button>
              );
            })}
          </nav>
                </div>
              </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-sm border-0 p-6">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">General Settings</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Site Name</label>
                    <input
                      type="text"
                      value={settings.siteName}
                      onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6566F1] focus:border-transparent"
                  />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Admin Email</label>
                    <input
                      type="email"
                      value={settings.adminEmail}
                      onChange={(e) => setSettings({...settings, adminEmail: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6566F1] focus:border-transparent"
                  />
                </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Site Description</label>
                  <textarea
                    value={settings.siteDescription}
                    onChange={(e) => setSettings({...settings, siteDescription: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6566F1] focus:border-transparent"
                  />
              </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                    <select
                      value={settings.timezone}
                      onChange={(e) => setSettings({...settings, timezone: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6566F1] focus:border-transparent"
                    >
                      <option value="UTC">UTC</option>
                      <option value="EST">Eastern Time</option>
                      <option value="PST">Pacific Time</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                    <select
                      value={settings.language}
                      onChange={(e) => setSettings({...settings, language: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6566F1] focus:border-transparent"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                    </select>
                  </div>
                </div>
              </div>
        )}

        {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Security Settings</h2>
                
              <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <h3 className="font-semibold text-gray-900">Two-Factor Authentication</h3>
                      <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.security.twoFactor}
                        onChange={(e) => setSettings({
                          ...settings,
                          security: {...settings.security, twoFactor: e.target.checked}
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#6566F1]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6566F1]"></div>
                    </label>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
                    <input
                      type="number"
                      value={settings.security.sessionTimeout}
                      onChange={(e) => setSettings({
                        ...settings,
                        security: {...settings.security, sessionTimeout: parseInt(e.target.value)}
                      })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6566F1] focus:border-transparent"
                    />
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password Policy</label>
                    <select
                      value={settings.security.passwordPolicy}
                      onChange={(e) => setSettings({
                        ...settings,
                        security: {...settings.security, passwordPolicy: e.target.value}
                      })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6566F1] focus:border-transparent"
                    >
                      <option value="basic">Basic</option>
                      <option value="strong">Strong</option>
                      <option value="very-strong">Very Strong</option>
                    </select>
              </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Notification Settings</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <h3 className="font-semibold text-gray-900">Email Notifications</h3>
                      <p className="text-sm text-gray-600">Receive notifications via email</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications.email}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: {...settings.notifications, email: e.target.checked}
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#6566F1]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6566F1]"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <h3 className="font-semibold text-gray-900">Push Notifications</h3>
                      <p className="text-sm text-gray-600">Receive push notifications in browser</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications.push}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: {...settings.notifications, push: e.target.checked}
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#6566F1]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6566F1]"></div>
                    </label>
                </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <h3 className="font-semibold text-gray-900">SMS Notifications</h3>
                      <p className="text-sm text-gray-600">Receive notifications via SMS</p>
                </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications.sms}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: {...settings.notifications, sms: e.target.checked}
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#6566F1]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6566F1]"></div>
                    </label>
                </div>
                </div>
              </div>
            )}

            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Integrations</h2>
                
              <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between">
                  <div>
                        <h3 className="font-semibold text-gray-900">N8N Webhooks</h3>
                        <p className="text-sm text-gray-600">Configure webhook endpoints for automation</p>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                        Connected
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">Email Service</h3>
                        <p className="text-sm text-gray-600">Configure SMTP settings for email delivery</p>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                        Active
                      </span>
                    </div>
                </div>

                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between">
                  <div>
                        <h3 className="font-semibold text-gray-900">Analytics</h3>
                        <p className="text-sm text-gray-600">Google Analytics integration</p>
                      </div>
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                        Pending
                      </span>
                    </div>
                  </div>
                </div>
              </div>
        )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
