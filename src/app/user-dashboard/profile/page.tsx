'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  Shield,
  Save,
  Camera,
  Key,
  Edit,
  User,
  Eye,
  EyeOff,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const ProfilePage = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });
  const [originalData, setOriginalData] = useState({
    firstName: '',
    lastName: '',
    email: ''
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

  // Deactivate account state
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivateConfirmText, setDeactivateConfirmText] = useState('');
  const [deactivating, setDeactivating] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [successMessage, setSuccessMessage] = useState('');

  // Avatar upload state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/profile');

      if (response.ok) {
        const data = await response.json();
        const profile = {
          firstName: data.profile?.firstName || data.firstName || '',
          lastName: data.profile?.lastName || data.lastName || '',
          email: data.profile?.email || data.email || session?.user?.email || ''
        };
        setProfileData(profile);
        setOriginalData(profile);

        // Set avatar preview if exists
        if (data.profile?.avatar) {
          setAvatarPreview(data.profile.avatar);
        }
      } else {
        // Fallback to session data
        if (session?.user) {
          const profile = {
            firstName: '',
            lastName: '',
            email: session.user.email || ''
          };
          setProfileData(profile);
          setOriginalData(profile);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      // Fallback to session data
      if (session?.user) {
        const profile = {
          firstName: '',
          lastName: '',
          email: session.user.email || ''
        };
        setProfileData(profile);
        setOriginalData(profile);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setErrors({});
      setSuccessMessage('');

      const response = await fetch('/api/user/profile', {
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
        setSuccessMessage('Profile updated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const error = await response.json();
        setErrors({ general: error.error || 'Failed to update profile' });
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setErrors({ general: 'Failed to save profile. Please try again.' });
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
      setErrors({});
      setSuccessMessage('');

      // Validate passwords
      if (!passwordData.currentPassword) {
        setErrors({ password: 'Please enter your current password' });
        return;
      }
      if (!passwordData.newPassword) {
        setErrors({ password: 'Please enter a new password' });
        return;
      }
      // Validate all password requirements at once
      const pwdErrors: string[] = [];
      if (passwordData.newPassword.length < 8) pwdErrors.push('8+ characters');
      if (!/[A-Z]/.test(passwordData.newPassword)) pwdErrors.push('uppercase letter');
      if (!/[a-z]/.test(passwordData.newPassword)) pwdErrors.push('lowercase letter');
      if (!/[0-9]/.test(passwordData.newPassword)) pwdErrors.push('number');
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(passwordData.newPassword)) pwdErrors.push('special character');

      if (pwdErrors.length > 0) {
        setErrors({ password: 'Password must include uppercase, lowercase, number, special character, and be 8+ characters long.' });
        return;
      }
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setErrors({ password: 'New passwords do not match' });
        return;
      }
      if (passwordData.currentPassword === passwordData.newPassword) {
        setErrors({ password: 'New password must be different from current password' });
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
        setSuccessMessage('Password changed successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const error = await response.json();
        setErrors({ password: error.error || 'Failed to change password' });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setErrors({ password: 'Failed to change password. Please try again.' });
    } finally {
      setChangingPassword(false);
    }
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

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors({ avatar: 'Please select an image file' });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ avatar: 'Image size must be less than 5MB' });
        return;
      }

      setErrors({ ...errors, avatar: '' });

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload avatar immediately
      try {
        const formData = new FormData();
        formData.append('avatar', file);

        const response = await fetch('/api/user/profile/avatar', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          setSuccessMessage('Avatar updated successfully!');
          setTimeout(() => setSuccessMessage(''), 3000);
        } else {
          const error = await response.json();
          setErrors({ avatar: error.error || 'Failed to upload avatar' });
          setAvatarPreview(null);
        }
      } catch (error) {
        console.error('Error uploading avatar:', error);
        setErrors({ avatar: 'Failed to upload avatar. Please try again.' });
        setAvatarPreview(null);
      }
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your profile information, security settings, and account preferences
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-green-800 font-semibold">{successMessage}</p>
          </div>
        </div>
      )}

      {/* General Error Message */}
      {errors.general && (
        <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-red-800 font-semibold">{errors.general}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6566F1]"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Profile Information Section */}
          <Card className="border border-gray-200 bg-white">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#6566F1] to-[#5A5BD9] rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Profile Information</CardTitle>
                  <CardDescription>
                    Update your personal information and profile details
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-start space-x-4 pb-6 border-b border-gray-100">
                <div className="relative w-20 h-20 bg-gradient-to-br from-[#6566F1] to-[#5A5BD9] rounded-full flex items-center justify-center overflow-hidden">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-white" />
                  )}
                </div>
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    className="border-gray-300 hover:bg-gray-50 text-gray-700"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Change Avatar
                  </Button>
                  <p className="text-sm text-gray-500">
                    Recommended: Square image, at least 200x200px
                  </p>
                  {errors.avatar && (
                    <p className="text-sm text-red-600">{errors.avatar}</p>
                  )}
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
                    className="border-gray-300 focus:border-[#6566F1] focus:ring-[#6566F1]"
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
                    className="border-gray-300 focus:border-[#6566F1] focus:ring-[#6566F1]"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <Input
                    value={profileData.email}
                    disabled={true}
                    className="border-gray-300 focus:border-[#6566F1] focus:ring-[#6566F1] bg-gray-100"
                    title="Email cannot be changed"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4 border-t border-gray-100">
                {!isEditing ? (
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="bg-[#6566F1] hover:bg-[#5A5BD9] text-white"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-[#6566F1] hover:bg-[#5A5BD9] text-white disabled:opacity-50 disabled:cursor-not-allowed"
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
            </CardContent>
          </Card>

          {/* Security Section */}
          <Card className="border border-gray-200 bg-white">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Security</CardTitle>
                  <CardDescription>
                    Manage your password and account security settings
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Password Error Message */}
              {errors.password && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <p className="text-red-800 text-sm">{errors.password}</p>
                </div>
              )}

              <h3 className="text-base font-semibold text-gray-900 flex items-center">
                <Key className="w-4 h-4 mr-2 text-[#6566F1]" />
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
                      className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 pr-10"
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
                      className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 pr-10"
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
                      className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 pr-10"
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
                  disabled={changingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                  className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-green-600 hover:to-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Key className="w-4 h-4 mr-2" />
                  {changingPassword ? 'Changing Password...' : 'Change Password'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Deactivate Account Section */}
          <Card className="border border-red-200 bg-white">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl text-gray-900">Deactivate Account</CardTitle>
                  <CardDescription>
                    Permanently deactivate your account and data
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                <h4 className="font-semibold text-red-900 mb-2 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Warning: This action cannot be undone
                </h4>
                <ul className="text-sm text-red-800 space-y-1 ml-7">
                  <li>• Your account will be deactivated immediately</li>
                  <li>• You will no longer be able to log in</li>
                  <li>• All your data and configurations will be deleted</li>
                  <li>• This action is irreversible</li>
                </ul>
              </div>

              {!showDeactivateModal ? (
                <Button
                  onClick={() => setShowDeactivateModal(true)}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Deactivate Account
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Type <span className="font-mono bg-red-100 px-2 py-1 rounded text-red-700">DEACTIVATE</span> to confirm
                    </label>
                    <Input
                      type="text"
                      value={deactivateConfirmText}
                      onChange={(e) => setDeactivateConfirmText(e.target.value)}
                      className={`border-2 ${
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

                  <div className="flex space-x-3">
                    <Button
                      onClick={() => {
                        setShowDeactivateModal(false);
                        setDeactivateConfirmText('');
                        setErrors({});
                      }}
                      variant="outline"
                      disabled={deactivating}
                      className="border-gray-300 hover:bg-gray-50 text-gray-700"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleDeactivateAccount}
                      disabled={deactivating || deactivateConfirmText !== 'DEACTIVATE'}
                      className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deactivating ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Deactivating...
                        </>
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
      )}
    </div>
  );
};

export default ProfilePage;

