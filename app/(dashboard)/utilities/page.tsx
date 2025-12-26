'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/lib/types';
import { Plus, Edit2, Trash2 } from 'lucide-react';

interface Utility {
  id: string;
  type: string;
  value: string;
  description?: string;
  is_active: boolean;
}

const utilityTypes = [
  { value: 'division_office', label: 'Division' },
  { value: 'document_type', label: 'Document Type' },
  { value: 'classification', label: 'Document Classification' },
  { value: 'destination_office', label: 'Destination Office' }
];

export default function UtilitiesPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [utilities, setUtilities] = useState<Utility[]>([]);
  const [selectedType, setSelectedType] = useState('division_office');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchUtilities = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient<ApiResponse<Utility[]>>(`/api/utilities/${selectedType}`, {
        token: token!
      });
      setUtilities(response.data);
    } finally {
      setLoading(false);
    }
  }, [selectedType, token]);

  useEffect(() => {
    if (token) {
      fetchUtilities();
    }
  }, [token, fetchUtilities]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this utility?')) return;

    try {
      await apiClient(`/api/utilities/${id}`, {
        method: 'DELETE',
        token: token!
      });
      fetchUtilities();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete utility');
    }
  };

  const filteredUtilities = utilities.filter(utility =>
    utility.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
    utility.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="ml-64">
      {/* Top Section - Tabs and Action Button */}
      <div className="flex items-center justify-between mb-6">
        {/* Tab Navigation */}
        <div className="flex gap-2">
          {utilityTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => setSelectedType(type.value)}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                selectedType === type.value
                  ? 'bg-blue-900 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* New Entry Button */}
        <button
          onClick={() => router.push(`/utilities/add?type=${selectedType}`)}
          className="flex items-center gap-2 bg-blue-900 text-white px-6 py-3 rounded-lg hover:bg-blue-800 transition-colors font-medium"
        >
          <Plus size={20} />
          <span>New Entry</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name or code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Content Area - Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : filteredUtilities.length > 0 ? (
          <div>
            {/* Table Header */}
            <div className="grid grid-cols-2 bg-gray-50 border-b border-gray-200">
              <div className="px-6 py-4 font-semibold text-gray-700">Name</div>
              <div className="px-6 py-4 font-semibold text-gray-700 text-right">Actions</div>
            </div>

            {/* Table Rows */}
            <div>
              {filteredUtilities.map((utility) => (
                <div
                  key={utility.id}
                  className="grid grid-cols-2 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <div className="px-6 py-4">
                    <div className="font-bold text-gray-900">{utility.value}</div>
                    {utility.description && (
                      <div className="text-sm text-gray-500 mt-1">{utility.description}</div>
                    )}
                  </div>
                  <div className="px-6 py-4 flex items-center justify-end gap-2">
                    <button
                      onClick={() => router.push(`/utilities/edit/${utility.id}`)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Edit2 size={16} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(utility.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Trash2 size={16} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            {searchQuery ? 'No entries match your search.' : 'No entries found. Add your first entry to get started.'}
          </div>
        )}
      </div>
    </div>
  );
}
