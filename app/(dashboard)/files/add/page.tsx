'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, apiClientFormData } from '@/lib/api-client';
import type { ApiResponse, AiReport, DocumentUploadResponse } from '@/lib/types';
import { ArrowLeft, FileText, X, Loader2 } from 'lucide-react';

interface Utility {
  id: string;
  value: string;
}

export default function AddDocumentPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [showReview, setShowReview] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    title: '',
    classification: '',
    document_type: '',
    division_office: '',
    sender_contact_person: '',
    sender_email: '',
    destination_office: '',
    destination_contact_person: '',
    destination_email: ''
  });

  // Auto-generate reference number
  const [referenceNumber] = useState(() => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `REF-${dateStr}-${randomStr}`;
  });

  const [file, setFile] = useState<File | null>(null);
  const [aiReport, setAiReport] = useState<AiReport | null>(null);

  // Search queries
  const [divisionSearchQuery, setDivisionSearchQuery] = useState('');
  const [destinationSearchQuery, setDestinationSearchQuery] = useState('');

  // Utilities
  const [classifications, setClassifications] = useState<Utility[]>([]);
  const [documentTypes, setDocumentTypes] = useState<Utility[]>([]);
  const [divisionOffices, setDivisionOffices] = useState<Utility[]>([]);
  const [destinationOffices, setDestinationOffices] = useState<Utility[]>([]);

  useEffect(() => {
    if (!token) return;

    const fetchUtilities = async () => {
      try {
        const [classRes, docTypeRes, divRes, destRes] = await Promise.all([
          apiClient<ApiResponse<Utility[]>>('/api/utilities/classification', { token: token! }),
          apiClient<ApiResponse<Utility[]>>('/api/utilities/document_type', { token: token! }),
          apiClient<ApiResponse<Utility[]>>('/api/utilities/division_office', { token: token! }),
          apiClient<ApiResponse<Utility[]>>('/api/utilities/destination_office', { token: token! })
        ]);

        setClassifications(classRes.data);
        setDocumentTypes(docTypeRes.data);
        setDivisionOffices(divRes.data);
        setDestinationOffices(destRes.data);
      } catch {
        setError('Failed to load form options');
      }
    };

    fetchUtilities();
  }, [token]);

  const filteredDivisionOffices = divisionOffices.filter(office =>
    office.value.toLowerCase().includes(divisionSearchQuery.toLowerCase())
  );

  const filteredDestinationOffices = destinationOffices.filter(office =>
    office.value.toLowerCase().includes(destinationSearchQuery.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user makes changes
    if (error) setError('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      // Clear error when user uploads a file
      if (error) setError('');
    }
  };

  const handleNext = async () => {
    // Validate all required fields
    if (!formData.title || !formData.classification || 
        !formData.document_type || !formData.division_office || !formData.destination_office) {
      setError('Please fill in all required fields');
      return;
    }

    if (!file) {
      setError('Please select a file');
      return;
    }

    try {
      setLoading(true);
      setProgress(0);
      setError('');

      // Simulate progress during upload
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 300);

      const formDataToSend = new FormData();
      formDataToSend.append('file', file);
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });

      const response = await apiClientFormData<DocumentUploadResponse>(
        '/api/documents',
        formDataToSend,
        token!
      );

      clearInterval(progressInterval);
      setProgress(100);

      setTimeout(() => {
        setAiReport(response.aiReport);
        setShowReview(true);
        setLoading(false);
        setProgress(0);
      }, 500);
    } catch (err) {
      setLoading(false);
      setProgress(0);
      setError(err instanceof Error ? err.message : 'Failed to process document');
    }
  };

  const handleConfirm = () => {
    router.push('/files');
  };

  return (
    <div className="ml-64">
      {/* Loading Modal */}
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex flex-col items-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Processing Document</h3>
              <div className="w-full">
                <div className="flex items-center mb-2">
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="ml-3 min-w-[45px] text-right">
                    <span className="text-sm font-medium text-gray-700">{Math.round(progress)}%</span>
                  </div>
                </div>
                <p className="text-gray-600 text-center mt-4 text-sm">
                  Uploading document and generating AI report...
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => showReview ? setShowReview(false) : router.back()}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={20} className="mr-2" />
        {showReview ? 'Back to Form' : 'Back to Files'}
      </button>

      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">{showReview ? 'Review Document' : 'Add New Document'}</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {!showReview ? (
        <div className="space-y-6">
          {/* Document Details Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Document Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference Number (Auto-generated)
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Document title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Classification *
                </label>
                <select
                  name="classification"
                  value={formData.classification}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select classification</option>
                  {classifications.map((c) => (
                    <option key={c.id} value={c.value}>
                      {c.value}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type of Document *
                </label>
                <select
                  name="document_type"
                  value={formData.document_type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select document type</option>
                  {documentTypes.map((t) => (
                    <option key={t.id} value={t.value}>
                      {t.value}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Sender Details Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Sender Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Division Office *
                </label>
                <input
                  type="text"
                  placeholder="Search division office..."
                  value={divisionSearchQuery}
                  onChange={(e) => setDivisionSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 mb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <select
                  name="division_office"
                  value={formData.division_office}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select division office</option>
                  {filteredDivisionOffices.map((d) => (
                    <option key={d.id} value={d.value}>
                      {d.value}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Person
                </label>
                <input
                  type="text"
                  name="sender_contact_person"
                  value={formData.sender_contact_person}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="sender_email"
                  value={formData.sender_email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="john@example.com"
                />
              </div>
            </div>
          </div>

          {/* Destination Details Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Destination Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Office *
                </label>
                <input
                  type="text"
                  placeholder="Search destination office..."
                  value={destinationSearchQuery}
                  onChange={(e) => setDestinationSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 mb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <select
                  name="destination_office"
                  value={formData.destination_office}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select destination office</option>
                  {filteredDestinationOffices.map((d) => (
                    <option key={d.id} value={d.value}>
                      {d.value}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Person
                </label>
                <input
                  type="text"
                  name="destination_contact_person"
                  value={formData.destination_contact_person}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Jane Smith"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="destination_email"
                  value={formData.destination_email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="jane@example.com"
                />
              </div>
            </div>
          </div>

          {/* File Upload Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wide">File</h2>
            
            {!file ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.gif,.bmp,.tiff"
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer inline-block"
                >
                  <div className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Choose File
                  </div>
                  <p className="text-sm text-gray-500 mt-4">
                    Supported formats: PDF, DOCX, TXT, Images (JPG, PNG, GIF, BMP, TIFF) - Max 10MB
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    📸 Image files and scanned documents will be automatically processed with OCR
                  </p>
                </label>
              </div>
            ) : (
              <div className="bg-gray-100 rounded-lg px-4 py-3 flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-red-500 rounded flex items-center justify-center">
                    <FileText size={24} className="text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} mb
                  </p>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Remove file"
                >
                  <X size={20} />
                </button>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-center gap-4">
            <button
              onClick={handleNext}
              disabled={loading || !file || !formData.title || !formData.classification || !formData.document_type || !formData.division_office || !formData.destination_office}
              className="bg-blue-900 text-white py-3 px-12 rounded-lg hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
            >
              {loading ? 'Processing...' : 'Next'}
            </button>
          </div>
        </div>
        ) : (
          /* Review Page - Two Column Layout */
          <div className="grid grid-cols-12 gap-6">
            {/* Left Column - Document Summary */}
            <div className="col-span-4 space-y-4">
              {/* Document Details */}
              <div className="bg-white rounded-lg border border-gray-300 p-4">
                <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase">Document Details</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Reference:</span>
                    <p className="font-medium text-gray-900">{referenceNumber}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Title:</span>
                    <p className="font-medium text-gray-900">{formData.title}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Classification:</span>
                    <p className="font-medium text-gray-900">{formData.classification}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Type:</span>
                    <p className="font-medium text-gray-900">{formData.document_type}</p>
                  </div>
                </div>
              </div>

              {/* Sender Details */}
              <div className="bg-white rounded-lg border border-gray-300 p-4">
                <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase">Sender Details</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Division Office:</span>
                    <p className="font-medium text-gray-900">{formData.division_office}</p>
                  </div>
                  {formData.sender_contact_person && (
                    <div>
                      <span className="text-gray-600">Contact Person:</span>
                      <p className="font-medium text-gray-900">{formData.sender_contact_person}</p>
                    </div>
                  )}
                  {formData.sender_email && (
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <p className="font-medium text-gray-900">{formData.sender_email}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Destination Details */}
              <div className="bg-white rounded-lg border border-gray-300 p-4">
                <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase">Destination Details</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Office:</span>
                    <p className="font-medium text-gray-900">{formData.destination_office}</p>
                  </div>
                  {formData.destination_contact_person && (
                    <div>
                      <span className="text-gray-600">Contact Person:</span>
                      <p className="font-medium text-gray-900">{formData.destination_contact_person}</p>
                    </div>
                  )}
                  {formData.destination_email && (
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <p className="font-medium text-gray-900">{formData.destination_email}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* File Info */}
              {file && (
                <div className="bg-white rounded-lg border border-gray-300 p-4">
                  <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase">Attached File</h3>
                  <div className="bg-gray-100 rounded-lg px-3 py-2 flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center flex-shrink-0">
                      <FileText size={18} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} mb</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - AI Generated Report */}
            <div className="col-span-8">
              <div className="bg-white rounded-lg border-2 border-gray-400 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">AI Generated Report</h3>
                
                {aiReport ? (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Purpose & Scope</h4>
                      <p className="text-gray-700 leading-relaxed">{aiReport.purposeAndScope || aiReport.purpose_and_scope}</p>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Summary</h4>
                      <p className="text-gray-700 leading-relaxed">{aiReport.summary}</p>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Highlights</h4>
                      <ul className="list-disc list-inside space-y-2">
                        {aiReport.highlights.map((highlight, index) => (
                          <li key={index} className="text-gray-700 leading-relaxed">
                            {highlight}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Issues</h4>
                      <div className="text-gray-700 leading-relaxed whitespace-pre-line bg-gray-50 p-4 rounded-lg border border-gray-200">
                        {aiReport.issues}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Recommendations</h4>
                      <div className="text-gray-700 leading-relaxed whitespace-pre-line bg-gray-50 p-4 rounded-lg border border-gray-200">
                        {aiReport.recommendations}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200 flex gap-4">
                      <button
                        onClick={() => setShowReview(false)}
                        className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                      >
                        Edit Document
                      </button>
                      <button
                        onClick={handleConfirm}
                        className="flex-1 bg-blue-900 text-white py-3 px-6 rounded-lg hover:bg-blue-800 transition-colors font-semibold"
                      >
                        Confirm & Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">Loading AI report...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
