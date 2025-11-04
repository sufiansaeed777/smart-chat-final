'use client';

import React, { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { User, Key, Save, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const AccountPage = () => {
  const { data: session } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [profileData, setProfileData] = useState({
    firstName: session?.user?.name?.split(' ')[0] || 'John',
    lastName: session?.user?.name?.split(' ')[1] || 'Doe',
    email: session?.user?.email || 'user@example.com'
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivateConfirmText, setDeactivateConfirmText] = useState('');
  const [deactivating, setDeactivating] = useState(false);

  const handleSaveProfile = async () => {
    setErrors({});
    setSuccessMessage('');

    // Validate required fields
    const newErrors: {[key: string]: string} = {};
    if (!profileData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!profileData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!profileData.email.trim()) {
      newErrors.email = 'Email is required';
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (profileData.email.trim() && !emailRegex.test(profileData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/user/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: profileData.firstName.trim(),
          lastName: profileData.lastName.trim(),
          email: profileData.email.trim()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const result = await response.json();
      console.log('Profile updated successfully:', result);

      setSuccessMessage('Profile updated successfully!');
    setIsEditing(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrors({ general: error instanceof Error ? error.message : 'Unknown error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setErrors({});
    setSuccessMessage('');

    // Validate passwords
    const newErrors: {[key: string]: string} = {};
    if (!passwordData.currentPassword.trim()) {
      newErrors.currentPassword = 'Current password is required';
    }
    if (!passwordData.newPassword.trim()) {
      newErrors.newPassword = 'New password is required';
    }
    if (!passwordData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your new password';
    }

    if (passwordData.newPassword && passwordData.confirmPassword &&
        passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'New passwords do not match';
    }

    if (passwordData.newPassword && passwordData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters long';
    }

    if (passwordData.currentPassword && passwordData.newPassword &&
        passwordData.currentPassword === passwordData.newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to change password');
      }

      const result = await response.json();
      console.log('Password changed successfully:', result);

      // Clear password fields
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSuccessMessage('Password changed successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error changing password:', error);
      setErrors({ password: error instanceof Error ? error.message : 'Unknown error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setProfileData({
      firstName: session?.user?.name?.split(' ')[0] || 'John',
      lastName: session?.user?.name?.split(' ')[1] || 'Doe',
      email: session?.user?.email || 'user@example.com'
    });
  };

  const handleDeactivateAccount = async () => {
    if (deactivateConfirmText !== 'DEACTIVATE') {
      setErrors({ deactivate: 'Please type DEACTIVATE to confirm' });
      return;
    }

    setDeactivating(true);
    setErrors({});

    try {
      const response = await fetch('/api/user/deactivate-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to deactivate account');
      }

      // Sign out and redirect to home page
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      console.error('Error deactivating account:', error);
      setErrors({ deactivate: error instanceof Error ? error.message : 'Unknown error occurred' });
    } finally {
      setDeactivating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50 p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#6566F1] to-[#5A5BD9] rounded-3xl mb-6 shadow-xl">
              <User className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">Profile Settings</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Manage your personal information and security settings
            </p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 text-center shadow-lg">
              <div className="flex items-center justify-center space-x-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-green-800 font-semibold text-lg">{successMessage}</p>
              </div>
            </div>
          )}

          {/* General Error Message */}
          {errors.general && (
            <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl p-6 text-center shadow-lg">
              <div className="flex items-center justify-center space-x-3">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <p className="text-red-800 font-semibold text-lg">{errors.general}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Profile Information */}
            <Card className="group bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-100 hover:shadow-3xl transition-all duration-500 hover:-translate-y-2">
              <CardHeader className="pb-8">
                <div className="flex items-center space-x-5">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#6566F1] to-[#5A5BD9] rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <User className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900">Personal Information</CardTitle>
                    <CardDescription className="text-gray-600 text-lg">
                      Update your name and email address
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      First Name
                    </label>
                    <Input
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                      disabled={!isEditing}
                      className={`h-14 rounded-2xl border-2 transition-all duration-300 text-lg ${
                        errors.firstName
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20 bg-red-50'
                          : isEditing
                            ? 'border-[#6566F1]/30 focus:border-[#6566F1] focus:ring-[#6566F1]/20 bg-white'
                            : 'border-gray-200 bg-gray-50'
                      }`}
                      placeholder="Enter your first name"
                    />
                    {errors.firstName && (
                      <p className="text-sm text-red-600">{errors.firstName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Last Name
                    </label>
                    <Input
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                      disabled={!isEditing}
                      className={`h-14 rounded-2xl border-2 transition-all duration-300 text-lg ${
                        errors.lastName
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20 bg-red-50'
                          : isEditing
                            ? 'border-[#6566F1]/30 focus:border-[#6566F1] focus:ring-[#6566F1]/20 bg-white'
                            : 'border-gray-200 bg-gray-50'
                      }`}
                      placeholder="Enter your last name"
                    />
                    {errors.lastName && (
                      <p className="text-sm text-red-600">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Email Address
                  </label>
                  <Input
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    disabled={!isEditing}
                    className={`h-14 rounded-2xl border-2 transition-all duration-300 text-lg ${
                      errors.email
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20 bg-red-50'
                        : isEditing
                          ? 'border-[#6566F1]/30 focus:border-[#6566F1] focus:ring-[#6566F1]/20 bg-white'
                          : 'border-gray-200 bg-gray-50'
                    }`}
                    placeholder="Enter your email address"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
                  {isEditing ? (
                    <>
                      <Button
                        onClick={handleCancel}
                        variant="outline"
                        disabled={loading}
                        className="h-14 px-8 rounded-2xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-300 text-lg font-semibold"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSaveProfile}
                        disabled={loading}
                        className="h-14 px-10 bg-gradient-to-r from-[#6566F1] to-[#5A5BD9] hover:from-[#5A5BD9] hover:to-[#4A4BC7] text-white rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all duration-300"
                      >
                        {loading ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Saving...</span>
                          </div>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => setIsEditing(true)}
                      className="h-14 px-10 bg-gradient-to-r from-[#6566F1] to-[#5A5BD9] hover:from-[#5A5BD9] hover:to-[#4A4BC7] text-white rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all duration-300"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Change Password */}
            <Card className="group bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-100 hover:shadow-3xl transition-all duration-500 hover:-translate-y-2">
              <CardHeader className="pb-8">
                <div className="flex items-center space-x-5">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Key className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900">Change Password</CardTitle>
                    <CardDescription className="text-gray-600 text-lg">
                      Update your password for better security
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Current Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                      className={`h-14 rounded-2xl border-2 pr-12 transition-all duration-300 text-lg ${
                        errors.currentPassword
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20 bg-red-50'
                          : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20'
                      }`}
                      placeholder="Enter your current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    >
                      {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.currentPassword && (
                    <p className="text-sm text-red-600">{errors.currentPassword}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    New Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                      className={`h-14 rounded-2xl border-2 pr-12 transition-all duration-300 text-lg ${
                        errors.newPassword
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20 bg-red-50'
                          : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20'
                      }`}
                      placeholder="Enter your new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.newPassword ? (
                    <p className="text-sm text-red-600">{errors.newPassword}</p>
                  ) : (
                    <p className="text-xs text-gray-500">Password must be at least 8 characters long</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                      className={`h-14 rounded-2xl border-2 pr-12 transition-all duration-300 text-lg ${
                        errors.confirmPassword
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20 bg-red-50'
                          : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20'
                      }`}
                      placeholder="Confirm your new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>

                <div className="flex justify-end pt-6 border-t border-gray-100">
                  <Button
                    onClick={handleChangePassword}
                    disabled={loading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                    className="h-14 px-10 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Changing...</span>
                      </div>
                    ) : (
                      <>
                        <Key className="w-4 h-4 mr-2" />
                        Change Password
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Deactivate Account */}
            <Card className="group bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-red-100 hover:shadow-3xl transition-all duration-500">
              <CardHeader className="pb-8">
                <div className="flex items-center space-x-5">
                  <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <AlertTriangle className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900">Deactivate Account</CardTitle>
                    <CardDescription className="text-gray-600 text-lg">
                      Permanently deactivate your account and data
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
                  <h4 className="font-semibold text-red-900 mb-2 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    Warning: This action cannot be undone
                  </h4>
                  <ul className="text-sm text-red-800 space-y-1 ml-7">
                    <li>• Your account will be deactivated immediately</li>
                    <li>• You will no longer be able to log in</li>
                    <li>• All your bots and configurations will be deleted</li>
                    <li>• Your chat history will be permanently removed</li>
                    <li>• This action is irreversible</li>
                  </ul>
                </div>

                {!showDeactivateModal ? (
                  <div className="flex justify-end pt-6 border-t border-red-100">
                    <Button
                      onClick={() => setShowDeactivateModal(true)}
                      className="h-14 px-10 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all duration-300"
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Deactivate Account
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 pt-6 border-t border-red-100">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Type <span className="font-mono bg-red-100 px-2 py-1 rounded text-red-700">DEACTIVATE</span> to confirm
                      </label>
                      <Input
                        type="text"
                        value={deactivateConfirmText}
                        onChange={(e) => setDeactivateConfirmText(e.target.value)}
                        className={`h-14 rounded-2xl border-2 transition-all duration-300 text-lg ${
                          errors.deactivate
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20 bg-red-50'
                            : 'border-gray-200 focus:border-red-500 focus:ring-red-500/20'
                        }`}
                        placeholder="Type DEACTIVATE"
                      />
                      {errors.deactivate && (
                        <p className="text-sm text-red-600">{errors.deactivate}</p>
                      )}
                    </div>

                    <div className="flex justify-end space-x-3">
                      <Button
                        onClick={() => {
                          setShowDeactivateModal(false);
                          setDeactivateConfirmText('');
                          setErrors({});
                        }}
                        variant="outline"
                        disabled={deactivating}
                        className="h-14 px-8 rounded-2xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-300 text-lg font-semibold"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleDeactivateAccount}
                        disabled={deactivating || deactivateConfirmText !== 'DEACTIVATE'}
                        className="h-14 px-10 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deactivating ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Deactivating...</span>
                          </div>
                        ) : (
                          <>
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            Confirm Deactivation
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
    </div>
  );
};

export default AccountPage;
