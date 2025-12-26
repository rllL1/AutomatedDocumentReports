'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import { ArrowLeft } from 'lucide-react';

const utilityTypes = [
  { value: 'division_office', label: 'Division' },
  { value: 'document_type', label: 'Document Type' },
  { value: 'classification', label: 'Document Classification' },
  { value: 'destination_office', label: 'Destination Office' }
];

export default function AddUtilityPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuth();
  
  const typeParam = searchParams.get('type') || 'division_office';
  
  const [formData, setFormData] = useState({
    type: typeParam,
    value: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await apiClient('/api/utilities', {
        method: 'POST',
        token: token!,
        body: JSON.stringify(formData)
      });
      router.push('/utilities');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create utility');
    } finally {
      setLoading(false);
    }
  };

  const selectedTypeLabel = utilityTypes.find(t => t.value === formData.type)?.label || '';

  const filteredTypes = utilityTypes.filter(type =>
    type.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="ml-120 px-8 py-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/utilities')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} />
          <span>Back to Utilities</span>
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Add New Entry</h1>
        <p className="text-gray-600 mt-2">Create a new {selectedTypeLabel.toLowerCase()} entry</p>
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
              Type *
            </label>
            <input
              type="text"
              placeholder="Search type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 mb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {filteredTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name *
            </label>
            <input
              type="text"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Abbreviation / Code
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Optional abbreviation or code"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.push('/utilities')}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Creating...' : 'Create Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
