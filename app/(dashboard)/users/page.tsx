'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/lib/types';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export default function UsersPage() {
  const router = useRouter();
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient<ApiResponse<User[]>>('/api/users', { token: token! });
      setUsers(response.data);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchUsers();
    }
  }, [token, fetchUsers]);

  const handleToggleStatus = async (userId: string) => {
    try {
      await apiClient(`/api/users/${userId}/toggle-status`, {
        method: 'PATCH',
        token: token!
      });
      fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to toggle status');
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await apiClient(`/api/users/${userId}`, {
        method: 'DELETE',
        token: token!
      });
      fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="max-w-6xl ml-auto mr-1 px-8 py-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Users</h1>
        <button
          onClick={() => router.push('/users/add')}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          <span>Add User</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '20%'}}>
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '25%'}}>
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '12%'}}>
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '13%'}}>
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '15%'}}>
                    Created
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '15%'}}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      <div className="truncate">{user.full_name}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <div className="truncate">{user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {user.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-3">
                        <button
                          onClick={() => router.push(`/users/edit/${user.id}`)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user.id)}
                          className="text-yellow-600 hover:text-yellow-900 transition-colors"
                          title={user.is_active ? 'Disable' : 'Enable'}
                        >
                          {user.is_active ? (
                            <ToggleRight size={18} />
                          ) : (
                            <ToggleLeft size={18} />
                          )}
                        </button>
                        {currentUser?.id !== user.id && (
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">No users found.</div>
        )}
      </div>
    </div>
  );
}
