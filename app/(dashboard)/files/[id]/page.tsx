'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import type { ApiResponse, AiReport } from '@/lib/types';
import { ArrowLeft } from 'lucide-react';

interface DocumentData {
  title: string;
  reference_number: string;
  classification: string;
  document_type: string;
  summary_basis: string;
  division_office: string;
  destination_office: string;
  created_at: string;
  file_name: string;
  ai_report?: AiReport;
}

export default function ViewDocumentPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const [data, setData] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDocument = useCallback(async () => {
    try {
      const response = await apiClient<ApiResponse<DocumentData>>(`/api/documents/${params.id}`, {
        token: token!
      });
      setData(response.data);
    } finally {
      setLoading(false);
    }
  }, [params.id, token]);

  useEffect(() => {
    if (token) {
      fetchDocument();
    }
  }, [token, fetchDocument]);

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!data) {
    return <div>Document not found</div>;
  }

  const report = data.ai_report;

  return (
    <div>
      <button
        onClick={() => router.back()}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={20} className="mr-2" />
        Back
      </button>

      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">{data.title}</h1>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600">Reference Number</p>
              <p className="font-medium">{data.reference_number}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Classification</p>
              <span className="px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
                {data.classification}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Document Type</p>
              <p className="font-medium">{data.document_type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Summary Basis</p>
              <p className="font-medium">{data.summary_basis}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Division Office</p>
              <p className="font-medium">{data.division_office}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Destination Office</p>
              <p className="font-medium">{data.destination_office}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Date Uploaded</p>
              <p className="font-medium">
                {new Date(data.created_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">File Name</p>
              <p className="font-medium">{data.file_name}</p>
            </div>
          </div>
        </div>

        {report && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">AI Generated Summary</h2>

            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Purpose & Scope</h3>
                <p className="text-gray-700">{report.purposeAndScope || report.purpose_and_scope}</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Summary</h3>
                <p className="text-gray-700">{report.summary}</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Highlights</h3>
                <ul className="list-disc list-inside space-y-2">
                  {report.highlights.map((highlight, index) => (
                    <li key={index} className="text-gray-700">
                      {highlight}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Issues</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{report.issues}</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Recommendations</h3>
                <p className="text-gray-700">{report.recommendations}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
