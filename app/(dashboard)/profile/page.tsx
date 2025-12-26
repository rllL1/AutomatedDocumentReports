'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import { User, Lock, Mail } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function ProfilePage() {
  const { user, token, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    department: user?.department || '',
    division: user?.division || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      await apiClient('/api/auth/profile', {
        method: 'PUT',
        token: token!,
        body: JSON.stringify(profileData)
      });
      
      // Refresh user data in AuthContext to update header and sidebar
      await refreshUser();
      
      setMessage('Profile updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await apiClient('/api/auth/change-password', {
        method: 'POST',
        token: token!,
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });
      setMessage('Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile</h1>

      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-md">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex items-center space-x-2 px-6 py-4 font-medium ${
                  activeTab === 'profile'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <User size={20} />
                <span>Profile Information</span>
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={`flex items-center space-x-2 px-6 py-4 font-medium ${
                  activeTab === 'password'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Lock size={20} />
                <span>Change Password</span>
              </button>
            </div>
          </div>

          <div className="p-8">
            {message && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
                {message}
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profileData.full_name}
                    onChange={(e) =>
                      setProfileData({ ...profileData, full_name: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={20}
                    />
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) =>
                        setProfileData({ ...profileData, email: e.target.value })
                      }
                      required
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    value={profileData.department}
                    onChange={(e) =>
                      setProfileData({ ...profileData, department: e.target.value })
                    }
                    placeholder="Enter your department"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Division
                  </label>
                  <input
                    type="text"
                    value={profileData.division}
                    onChange={(e) =>
                      setProfileData({ ...profileData, division: e.target.value })
                    }
                    placeholder="Enter your division"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <input
                    type="text"
                    value={user?.role || ''}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? 'Updating...' : 'Update Profile'}
                </button>
              </form>
            )}

            {/* Password Tab */}
            {activeTab === 'password' && (
              <form onSubmit={handlePasswordChange} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, currentPassword: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, newPassword: e.target.value })
                    }
                    required
                    minLength={8}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                  />
                  <p className="text-sm text-gray-500 mt-1">Minimum 8 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                    }
                    required
                    minLength={8}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
