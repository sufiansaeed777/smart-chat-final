'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {

  Bell,
  Shield,
  Globe,
  Palette,
  Save,
  Camera,
  Key,
  Edit,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import DashboardLayoutWithAuth from '@/components/dashboard/DashboardLayoutWithAuth';

const SettingsPage = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    bio: ''
  });
  const [originalData, setOriginalData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    bio: ''
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'integrations', label: 'Integrations', icon: Globe },
    { id: 'preferences', label: 'Preferences', icon: Palette }
  ];

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/manager/profile');

      if (response.ok) {
        const data = await response.json();
        const profile = {
          firstName: data.profile.firstName || '',
          lastName: data.profile.lastName || '',
          email: data.profile.email || '',
          company: '',
          bio: ''
        };
        setProfileData(profile);
        setOriginalData(profile);
      } else {
        console.error('Failed to load profile');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/manager/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: profileData.firstName,
          lastName: profileData.lastName
        })
      });

      if (response.ok) {
        const data = await response.json();
        setOriginalData(profileData);
        setIsEditing(false);
        alert('Profile updated successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to update profile: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setProfileData(originalData);
    setIsEditing(false);
  };

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <DashboardLayoutWithAuth activeSection="settings">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Tabs Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-purple-600 text-purple-600 bg-purple-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Profile Tab Content */}
        {activeTab === 'profile' && (
          <Card className="border border-gray-200 bg-white">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-purple-600" />
                <div>
                  <CardTitle className="text-lg">Profile Information</CardTitle>
                  <CardDescription>
                    Update your profile information and avatar
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                </div>
              ) : (
                <>
              {/* Avatar Section */}
              <div className="flex items-start space-x-4">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-10 h-10 text-gray-400" />
                </div>
                <div className="space-y-2">
                  <Button variant="outline" className="border-gray-300 hover:bg-gray-50 text-gray-700">
                    <Camera className="w-4 h-4 mr-2" />
                    Change Avatar
                  </Button>
                  <p className="text-sm text-gray-500">
                    Recommended: Square image, at least 200x200px
                  </p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <Input
                    value={profileData.firstName}
                    onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                    disabled={!isEditing}
                    className="border-gray-300 focus:border-purple-600 focus:ring-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <Input
                    value={profileData.lastName}
                    onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                    disabled={!isEditing}
                    className="border-gray-300 focus:border-purple-600 focus:ring-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <Input
                    value={profileData.email}
                    disabled={true}
                    className="border-gray-300 focus:border-purple-600 focus:ring-purple-600 bg-gray-100"
                    title="Email cannot be changed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company
                  </label>
                  <Input
                    value={profileData.company}
                    onChange={(e) => setProfileData({...profileData, company: e.target.value})}
                    disabled={!isEditing}
                    className="border-gray-300 focus:border-purple-600 focus:ring-purple-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <Textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                  disabled={!isEditing}
                  rows={4}
                  className="border-gray-300 focus:border-purple-600 focus:ring-purple-600"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                {!isEditing ? (
                  <Button 
                    onClick={() => setIsEditing(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      disabled={saving}
                      className="border-gray-300 hover:bg-gray-50 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
              </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Notifications Tab Content */}
        {activeTab === 'notifications' && (
          <Card className="border border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-lg">Notification Settings</CardTitle>
              <CardDescription>
                Configure how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h3 className="font-medium">Email Notifications</h3>
                    <p className="text-sm text-gray-600">Receive updates via email</p>
                  </div>
                  <Badge variant="outline">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h3 className="font-medium">Push Notifications</h3>
                    <p className="text-sm text-gray-600">Receive push notifications</p>
                  </div>
                  <Badge variant="outline">Disabled</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Security Tab Content */}
        {activeTab === 'security' && (
          <Card className="border border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-lg">Security Settings</CardTitle>
              <CardDescription>
                Manage your account security
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button 
                  variant="outline" 
                  className="border-gray-300 hover:bg-gray-50 text-gray-700"
                  onClick={() => handleNavigation('/dashboard/help')}
                >
                  <Key className="w-4 h-4 mr-2" />
                  Change Password
                </Button>
                <Button 
                  variant="outline" 
                  className="border-gray-300 hover:bg-gray-50 text-gray-700"
                  onClick={() => handleNavigation('/dashboard/analytics')}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Enable Two-Factor Authentication
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Integrations Tab Content */}
        {activeTab === 'integrations' && (
          <Card className="border border-gray-200 bg-white">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Globe className="w-5 h-5 text-purple-600" />
                <div>
                  <CardTitle className="text-lg">Integrations</CardTitle>
                  <CardDescription>
                    Connect your bots with external services and platforms
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-medium mb-2">Slack</h3>
                  <p className="text-sm text-gray-600 mb-3">Send bot notifications to your Slack channels</p>
                  <Badge variant="outline" className="mb-3">Not Connected</Badge>
                  <Button 
                    size="sm" 
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={() => handleNavigation('/dashboard/bots')}
                  >
                    Connect
                  </Button>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-medium mb-2">Discord</h3>
                  <p className="text-sm text-gray-600 mb-3">Add bot capabilities to your Discord server</p>
                  <Badge variant="outline" className="mb-3">Not Connected</Badge>
                  <Button 
                    size="sm" 
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={() => handleNavigation('/dashboard/bots')}
                  >
                    Connect
                  </Button>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-medium mb-2">Zapier</h3>
                  <p className="text-sm text-gray-600 mb-3">Automate workflows with 5000+ apps</p>
                  <Badge variant="outline" className="mb-3">Connected</Badge>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="border-gray-300 hover:bg-gray-50 text-gray-700"
                    onClick={() => handleNavigation('/dashboard/analytics')}
                  >
                    Configure
                  </Button>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-medium mb-2">WhatsApp</h3>
                  <p className="text-sm text-gray-600 mb-3">Deploy bots on WhatsApp Business</p>
                  <Badge variant="outline" className="mb-3">Connected</Badge>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="border-gray-300 hover:bg-gray-50 text-gray-700"
                    onClick={() => handleNavigation('/dashboard/analytics')}
                  >
                    Configure
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preferences Tab Content */}
        {activeTab === 'preferences' && (
          <Card className="border border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-lg">Preferences</CardTitle>
              <CardDescription>
                Customize your experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h3 className="font-medium">Dark Mode</h3>
                    <p className="text-sm text-gray-600">Switch to dark theme</p>
                  </div>
                  <Badge variant="outline">Light</Badge>
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h3 className="font-medium">Language</h3>
                    <p className="text-sm text-gray-600">Choose your preferred language</p>
                  </div>
                  <Badge variant="outline">English</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayoutWithAuth>
  );
};

export default SettingsPage;
