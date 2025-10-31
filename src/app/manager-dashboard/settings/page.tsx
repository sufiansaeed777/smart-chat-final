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
  User,
  Eye,
  EyeOff
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

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

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

  const handleChangePassword = async () => {
    try {
      // Validate passwords
      if (!passwordData.currentPassword) {
        alert('Please enter your current password');
        return;
      }
      if (!passwordData.newPassword) {
        alert('Please enter a new password');
        return;
      }
      if (passwordData.newPassword.length < 8) {
        alert('New password must be at least 8 characters long');
        return;
      }
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        alert('New passwords do not match');
        return;
      }
      if (passwordData.currentPassword === passwordData.newPassword) {
        alert('New password must be different from current password');
        return;
      }

      setChangingPassword(true);
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      if (response.ok) {
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        alert('Password changed successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to change password: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Failed to change password. Please try again.');
    } finally {
      setChangingPassword(false);
    }
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
                    Company <span className="text-xs text-gray-500">(Coming Soon)</span>
                  </label>
                  <Input
                    value={profileData.company}
                    disabled={true}
                    placeholder="Company field not yet available"
                    className="border-gray-300 focus:border-purple-600 focus:ring-purple-600 bg-gray-100"
                    title="Company field will be available in a future update"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio <span className="text-xs text-gray-500">(Coming Soon)</span>
                </label>
                <Textarea
                  value={profileData.bio}
                  disabled={true}
                  placeholder="Bio field not yet available. You'll be able to add a personal bio in a future update."
                  rows={4}
                  className="border-gray-300 focus:border-purple-600 focus:ring-purple-600 bg-gray-100"
                  title="Bio field will be available in a future update"
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
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-purple-600" />
                <div>
                  <CardTitle className="text-lg">Security Settings</CardTitle>
                  <CardDescription>
                    Manage your password and account security
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Change Password Section */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center">
                  <Key className="w-4 h-4 mr-2 text-purple-600" />
                  Change Password
                </h3>
                <div className="space-y-4">
                  {/* Current Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                        className="border-gray-300 focus:border-purple-600 focus:ring-purple-600 pr-10"
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        className="border-gray-300 focus:border-purple-600 focus:ring-purple-600 pr-10"
                        placeholder="Enter new password (min 8 characters)"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        className="border-gray-300 focus:border-purple-600 focus:ring-purple-600 pr-10"
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Change Password Button */}
                  <Button
                    onClick={handleChangePassword}
                    disabled={changingPassword}
                    className="bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Key className="w-4 h-4 mr-2" />
                    {changingPassword ? 'Changing Password...' : 'Change Password'}
                  </Button>
                </div>
              </div>

              {/* Two-Factor Authentication Section */}
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center">
                  <Shield className="w-4 h-4 mr-2 text-purple-600" />
                  Two-Factor Authentication
                </h3>
                <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium text-gray-900">2FA Status</p>
                      <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                    </div>
                    <Badge variant="outline" className="text-gray-600">Coming Soon</Badge>
                  </div>
                  <p className="text-xs text-gray-500">
                    Two-factor authentication will be available in a future update
                  </p>
                </div>
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
