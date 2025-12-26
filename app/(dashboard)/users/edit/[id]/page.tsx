'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/lib/types';
import { ArrowLeft } from 'lucide-react';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const { token } = useAuth();
  const userId = params.id as string;
  
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: 'user'
  });
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setFetchingData(true);
        const response = await apiClient<ApiResponse<User[]>>('/api/users', {
          token: token!
        });
        const user = response.data.find(u => u.id === userId);
        if (user) {
          setFormData({
            email: user.email,
            full_name: user.full_name,
            role: user.role
          });
        } else {
          setError('User not found');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch user');
      } finally {
        setFetchingData(false);
      }
    };

    if (token && userId) {
      fetchUser();
    }
  }, [token, userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await apiClient(`/api/users/${userId}`, {
        method: 'PUT',
        token: token!,
        body: JSON.stringify(formData)
      });
      router.push('/users');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <div className="ml-64 px-8 py-6 max-w-4xl mx-auto">
        <div className="text-center py-12 text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="ml-64 px-8 py-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/users')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} />
          <span>Back to Users</span>
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Edit User</h1>
        <p className="text-gray-600 mt-2">Update user information</p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role *
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.push('/users')}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Updating...' : 'Update User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
