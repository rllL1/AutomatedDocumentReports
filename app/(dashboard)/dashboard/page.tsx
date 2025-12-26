'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/lib/types';
import { FileText, FileCheck, Users as UsersIcon, Clock } from 'lucide-react';
import Box from '@mui/material/Box';
import { BarChart } from '@mui/x-charts/BarChart';

interface Document {
  id: string;
  reference_number: string;
  title: string;
  classification: string;
  created_at: string;
}

interface DashboardStats {
  total_documents: number;
  total_ai_reports: number;
  total_users: number;
  recent_uploads: Document[];
  classification_counts?: Record<string, number>;
  document_type_counts?: Record<string, number>;
}

export default function DashboardPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient<ApiResponse<DashboardStats>>('/api/dashboard/stats', { token: token! });
      setStats(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return <div className="text-center py-8">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="text-red-600 p-4 bg-red-50 rounded-lg">{error}</div>;
  }

  return (
    <div className="ml-64">
      {/* Enhanced Blue Banner Card */}
      <div className="mb-8">
        <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 rounded-2xl shadow-2xl overflow-hidden">
          {/* Decorative Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -mr-48 -mt-48"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-white rounded-full -ml-40 -mb-40"></div>
          </div>
          
          {/* Content */}
          <div className="relative z-10 p-12">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <FileText className="text-white" size={32} />
                  </div>
                  <div>
                    <h1 className="text-5xl font-bold text-white mb-2 tracking-tight">
                      Welcome to DICT-DES
                    </h1>
                    <p className="text-blue-100 text-xl">
                      Document Evaluation System Dashboard
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex items-center gap-6 text-blue-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm">System Active</span>
                  </div>
                  <div className="text-sm">
                    {new Date().toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>
              </div>
              
              {/* Quick Stats Badge */}
              <div className="hidden lg:flex flex-col gap-3">
                <div className="bg-white/10 backdrop-blur-md rounded-lg px-6 py-3 border border-white/20">
                  <div className="text-white/80 text-xs font-medium mb-1">Total Documents</div>
                  <div className="text-white text-2xl font-bold">{stats?.total_documents || 0}</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-lg px-6 py-3 border border-white/20">
                  <div className="text-white/80 text-xs font-medium mb-1">AI Reports</div>
                  <div className="text-white text-2xl font-bold">{stats?.total_ai_reports || 0}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats Grid (if needed) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Documents</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.total_documents || 0}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <FileText className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">AI Reports Generated</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.total_ai_reports || 0}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <FileCheck className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.total_users || 0}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <UsersIcon className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Document Analytics Chart */}
      <div className="bg-white rounded-lg shadow-md p-6 mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Document Analytics</h2>
        {stats?.classification_counts && stats?.document_type_counts && Object.keys(stats.classification_counts).length > 0 && Object.keys(stats.document_type_counts).length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* By Classification */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">By Classification</h3>
              <Box sx={{ width: 1, height: 300 }}>
                <BarChart
                  series={[
                    { 
                      data: Object.values(stats.classification_counts), 
                      label: 'Documents', 
                      id: 'classificationId', 
                      color: '#2563eb' 
                    },
                  ]}
                  xAxis={[{ 
                    data: Object.keys(stats.classification_counts), 
                    scaleType: 'band' 
                  }]}
                  yAxis={[{ label: 'Count' }]}
                />
              </Box>
            </div>

            {/* By Document Type */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">By Document Type</h3>
              <Box sx={{ width: 1, height: 300 }}>
                <BarChart
                  series={[
                    { 
                      data: Object.values(stats.document_type_counts), 
                      label: 'Documents', 
                      id: 'docTypeId', 
                      color: '#10b981' 
                    },
                  ]}
                  xAxis={[{ 
                    data: Object.keys(stats.document_type_counts), 
                    scaleType: 'band' 
                  }]}
                  yAxis={[{ label: 'Count' }]}
                />
              </Box>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <FileText size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No analytics data available</p>
          </div>
        )}
      </div>

      {/* Recent Uploads */}
      <div className="bg-white rounded-lg shadow-md p-6 mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Uploads</h2>

        {stats?.recent_uploads && stats.recent_uploads.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference No.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Classification
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Uploaded
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.recent_uploads.map((doc) => (
                  <tr key={doc.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {doc.reference_number}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{doc.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {doc.classification}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Clock size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No recent uploads</p>
          </div>
        )}
      </div>
    </div>
  );
}
