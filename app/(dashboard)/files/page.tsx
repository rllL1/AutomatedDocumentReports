'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/lib/types';
import { Plus, Eye, Search, Archive, X, FileText, Download } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Document {
  id: string;
  reference_number: string;
  title: string;
  classification: string;
  document_type: string;
  division_office: string;
  destination_office: string;
  created_at: string;
}

interface DetailedDocument extends Document {
  sender_contact_person?: string;
  sender_email?: string;
  destination_contact_person?: string;
  destination_email?: string;
  file_path?: string;
  file_name?: string;
  file_size?: number;
  description?: string;
}

interface AIReport {
  id: string;
  document_id: string;
  purpose_and_scope: string;
  summary: string;
  highlights: string[];
  issues: string;
  recommendations: string;
  created_at: string;
}

interface DocumentWithReport {
  document: DetailedDocument;
  report: AIReport | null;
}

export default function FilesPage() {
  const { token } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewingDocument, setViewingDocument] = useState<DetailedDocument | null>(null);
  const [viewingReport, setViewingReport] = useState<AIReport | null>(null);
  const [activeTab, setActiveTab] = useState<'view' | 'original' | 'report'>('view');
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string>('');

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient<ApiResponse<Document[]>>('/api/documents', { token: token! });
      setDocuments(response.data);
      setFilteredDocuments(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    const filtered = documents.filter((doc) =>
      doc.reference_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.document_type.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredDocuments(filtered);
  }, [searchQuery, documents]);

  const handleArchive = async (id: string) => {
    if (!confirm('Are you sure you want to archive this document?')) return;

    try {
      await apiClient(`/api/documents/${id}`, {
        method: 'DELETE',
        token: token!
      });
      setDocuments(documents.filter((doc) => doc.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to archive document');
    }
  };

  const handleViewDocument = async (doc: Document) => {
    setLoadingDetails(true);
    setViewingDocument(null);
    setViewingReport(null);
    setFilePreviewUrl('');
    setActiveTab('view');
    
    try {
      const response = await apiClient<ApiResponse<DocumentWithReport>>(`/api/documents/${doc.id}`, { token: token! });
      setViewingDocument(response.data.document);
      setViewingReport(response.data.report);
      
      // Load file preview if file exists
      if (response.data.document.file_path) {
        const url = await getFileUrl(doc.id);
        setFilePreviewUrl(url);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load document details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeViewPanel = () => {
    // Revoke blob URL to free memory
    if (filePreviewUrl) {
      window.URL.revokeObjectURL(filePreviewUrl);
    }
    setViewingDocument(null);
    setViewingReport(null);
    setFilePreviewUrl('');
    setActiveTab('view');
  };

  const cleanFilePath = (filePath: string) => {
    // Remove 'documents/' prefix if it exists since we're already specifying the bucket
    return filePath.startsWith('documents/') ? filePath.substring(10) : filePath;
  };

  const downloadFile = async (documentId: string, fileName: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/documents/${documentId}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      // Get the blob from response
      const blob = await response.blob();
      
      // Create blob URL and trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file. Please try again.');
    }
  };

  const getFileUrl = async (documentId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/documents/${documentId}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load file');
      }

      // Get the blob from response
      const blob = await response.blob();
      
      // Create blob URL for preview
      const url = window.URL.createObjectURL(blob);
      return url;
    } catch (error) {
      console.error('Error loading file:', error);
      return '';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    const kb = bytes / 1024;
    return `${kb.toFixed(2)} KB`;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatItemsForPDF = (text: string) => {
    // Split by numbered items (1., 2., 3., etc.)
    const items = text.split(/(?=\d+\.\s)/);
    
    return items
      .filter(item => item.trim())
      .map(item => {
        // Extract number, content, and basis
        const match = item.match(/^(\d+)\.\s*([\s\S]*?)(?:\n\n?Basis:\s*([\s\S]*?))?$/);
        
        if (match) {
          const [, number, content, basis] = match;
          
          let html = '<div class="numbered-item">';
          html += `<div class="item-main"><strong>${number}.</strong>${content.trim()}</div>`;
          
          if (basis) {
            html += '<div class="item-basis">';
            html += '<span class="basis-label">Basis:</span> ';
            html += basis.trim();
            html += '</div>';
          }
          
          html += '</div>';
          return html;
        }
        
        // Fallback for non-matching format
        return `<div class="numbered-item">${item.trim().replace(/\n/g, '<br/>')}</div>`;
      })
      .join('');
  };

  const generateReportPDF = () => {
    if (!viewingReport || !viewingDocument) return;

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Get current date/time for header
    const now = new Date();
    const formattedDate = now.toLocaleString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    // Build the HTML content matching the template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Accomplishment Report - ${viewingDocument.title}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 0.75in 0.75in 1in 0.75in;
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Arial', 'Helvetica', sans-serif;
            font-size: 10.5pt;
            line-height: 1.5;
            color: #1a1a1a;
            margin: 0;
            padding: 0;
          }
          
          .content {
            margin: 0;
            padding: 0;
          }
          
          /* Logo Header */
          .logo-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-block-end: 12px;
            padding-block-end: 8px;
            border-block-end: 2px solid #0038A8;
          }
          
          .logo-left {
            display: flex;
            align-items: center;
          }
          
          .logo-left img {
            inline-size: 150px;
            block-size: auto;
          }
          
          .logo-right {
            display: flex;
            align-items: center;
          }
          
          .logo-right img {
            inline-size: 55px;
            block-size: auto;
          }
          
          /* Document Header */
          .doc-header {
            margin-block-end: 18px;
            font-size: 9pt;
            line-height: 1.5;
          }
          
          .doc-header-line {
            margin-block-end: 3px;
          }
          
          .doc-header strong {
            font-weight: 600;
          }
          
          /* Section Headers */
          h2 {
            font-size: 11.5pt;
            font-weight: 700;
            margin-block-start: 16px;
            margin-block-end: 10px;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: #1a1a1a;
          }
          
          /* Section Content */
          .section-content {
            text-align: justify;
            line-height: 1.6;
            margin-block-end: 12px;
            font-size: 10.5pt;
          }
          
          /* Highlights List */
          .highlights-list {
            margin-inline-start: 0;
            padding-inline-start: 0;
            list-style: none;
            counter-reset: item;
          }
          
          .highlights-list li {
            counter-increment: item;
            margin-block-end: 10px;
            line-height: 1.6;
            text-align: justify;
            font-size: 10.5pt;
          }
          
          .highlights-list li:before {
            content: counter(item) ".";
            font-weight: 600;
            margin-inline-end: 6px;
          }
          
          /* Issues and Recommendations */
          .numbered-item {
            margin-block-end: 14px;
            text-align: justify;
            line-height: 1.6;
            font-size: 10.5pt;
          }
          
          .item-main {
            margin-block-end: 6px;
          }
          
          .item-main strong {
            font-weight: 600;
          }
          
          .item-basis {
            margin-inline-start: 0;
            line-height: 1.6;
            font-size: 10pt;
          }
          
          .basis-label {
            font-weight: 600;
          }
          
          /* Page break control */
          .page-break {
            page-break-before: always;
          }
          
          /* Footer */
          .footer {
            position: fixed;
            inset-block-end: 0;
            inset-inline-start: 0;
            inset-inline-end: 0;
            block-size: auto;
            border-block-start: 1.5px solid #0038A8;
            padding: 10px 0.75in 10px 0.75in;
            background: white;
            font-size: 7.5pt;
            line-height: 1.5;
            color: #0038A8;
          }
          
          .footer-content {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          
          .footer-left,
          .footer-center,
          .footer-right {
            flex: 1;
          }
          
          .footer-left {
            text-align: start;
            font-weight: 500;
          }
          
          .footer-center {
            text-align: center;
            font-weight: 700;
          }
          
          .footer-right {
            text-align: end;
            font-weight: 500;
          }
          
          @media print {
            body {
              margin: 0;
              padding: 0.75in 0.75in 1in 0.75in;
            }
            
            .footer {
              position: fixed;
              inset-block-end: 0;
            }
            
            .page-break {
              page-break-before: always;
            }
          }
        </style>
      </head>
      <body>
        <div class="content">
          <!-- Logo Header -->
          <div class="logo-header">
            <div class="logo-left">
              <img src="/12.png" alt="DICT Logo" />
            </div>
            <div class="logo-right">
              <img src="/Pilipns.png" alt="Philippines Logo" />
            </div>
          </div>
          
          <!-- Document Header -->
          <div class="doc-header">
            <div class="doc-header-line">
              <strong>Document:</strong>${viewingDocument.file_name || viewingDocument.title}
            </div>
            <div class="doc-header-line">
              <strong>Generated:</strong>${formattedDate}
            </div>
          </div>

          <!-- Purpose & Scope -->
          <h2>Purpose & Scope</h2>
          <div class="section-content">
            ${viewingReport.purpose_and_scope}
          </div>

          <!-- Summary -->
          <h2>Summary</h2>
          <div class="section-content">
            ${viewingReport.summary}
          </div>

          <!-- Highlights -->
          <div class="page-break"></div>
          <h2>Highlights</h2>
          <ol class="highlights-list">
            ${viewingReport.highlights.map(highlight => `<li>${highlight}</li>`).join('')}
          </ol>

          <!-- Issues -->
          ${viewingReport.issues ? `
          <div class="page-break"></div>
          <h2>Issues</h2>
          <div class="section-content">
            ${formatItemsForPDF(viewingReport.issues)}
          </div>
          ` : ''}

          <!-- Recommendations -->
          <div class="page-break"></div>
          <h2>Recommendations</h2>
          <div class="section-content">
            ${formatItemsForPDF(viewingReport.recommendations)}
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <div class="footer-content">
            <div class="footer-left">
              DICT Headquarters, 807 EDSA,<br/>
              Diliman, Quezon City, 1103<br/>
              Philippines
            </div>
            <div class="footer-center">
              Accomplishment Report
            </div>
            <div class="footer-right">
              https://www.dict.gov.ph<br/>
              +632 8920 0101
            </div>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  if (loading) {
    return <div className="ml-64 text-center py-8">Loading documents...</div>;
  }

  return (
    <div className="ml-64">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Files</h1>
        <Link
          href="/files/add"
          className="flex items-center space-x-2 bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800"
        >
          <Plus size={20} />
          <span>Add Document</span>
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search documents by reference number, title, or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {filteredDocuments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Documents
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                    Date Received
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900">{doc.reference_number}</span>
                        <span className="text-sm text-gray-600 mt-1">{doc.title}</span>
                        <div className="flex gap-2 mt-2">
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                            {doc.classification}
                          </span>
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800">
                            {doc.document_type}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">
                      {new Date(doc.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleViewDocument(doc)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          <Eye size={16} />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => handleArchive(doc.id)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                        >
                          <Archive size={16} />
                          <span>Archive</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            {searchQuery ? (
              <p>No documents found matching &quot;{searchQuery}&quot;</p>
            ) : (
              <p>No documents found. Add your first document to get started.</p>
            )}
          </div>
        )}
      </div>

      {/* View Panel Slide-in */}
      {viewingDocument && (
        <>
          {/* Backdrop */}
          <div 
            
            onClick={closeViewPanel}
          />
          
          {/* Slide-in Panel */}
          <div className="fixed top-0 right-0 h-full w-full md:w-2/3 lg:w-1/2 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">{viewingDocument.title}</h2>
              <button
                onClick={closeViewPanel}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 bg-gray-50 px-6">
              <button
                onClick={() => setActiveTab('view')}
                className={`px-6 py-3 font-medium text-sm transition-colors relative ${
                  activeTab === 'view'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                View
              </button>
              <button
                onClick={() => setActiveTab('original')}
                className={`px-6 py-3 font-medium text-sm transition-colors relative ${
                  activeTab === 'original'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Original
              </button>
              <button
                onClick={() => setActiveTab('report')}
                className={`px-6 py-3 font-medium text-sm transition-colors relative ${
                  activeTab === 'report'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Report
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingDetails ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading document details...</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* View Tab Content */}
                  {activeTab === 'view' && (
                    <div className="space-y-6">
                      {/* Document Details Section */}
                      <section>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                          Document Details
                        </h3>
                        <div className="space-y-3">
                          <div className="flex">
                            <span className="text-sm text-gray-500 w-40">Document ID:</span>
                            <span className="text-sm text-gray-900 font-medium">{viewingDocument.reference_number}</span>
                          </div>
                          <div className="flex">
                            <span className="text-sm text-gray-500 w-40">Created Date & Time:</span>
                            <span className="text-sm text-gray-900">{formatDateTime(viewingDocument.created_at)}</span>
                          </div>
                          <div className="flex">
                            <span className="text-sm text-gray-500 w-40">Document Type:</span>
                            <span className="text-sm text-gray-900">{viewingDocument.document_type}</span>
                          </div>
                          <div className="flex">
                            <span className="text-sm text-gray-500 w-40">Title:</span>
                            <span className="text-sm text-gray-900 font-medium">{viewingDocument.title}</span>
                          </div>
                          <div className="flex">
                            <span className="text-sm text-gray-500 w-40">Classification:</span>
                            <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {viewingDocument.classification}
                            </span>
                          </div>
                          {viewingDocument.description && (
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-500 mb-1">Description:</span>
                              <span className="text-sm text-gray-900">{viewingDocument.description}</span>
                            </div>
                          )}
                        </div>
                      </section>

                      {/* Sender Details Section */}
                      <section>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                          Sender Details
                        </h3>
                        <div className="space-y-3">
                          <div className="flex">
                            <span className="text-sm text-gray-500 w-40">Contact Person:</span>
                            <span className="text-sm text-gray-900">{viewingDocument.sender_contact_person || 'N/A'}</span>
                          </div>
                          <div className="flex">
                            <span className="text-sm text-gray-500 w-40">Email:</span>
                            <span className="text-sm text-gray-900">{viewingDocument.sender_email || 'N/A'}</span>
                          </div>
                        </div>
                      </section>

                      {/* Destination Details Section */}
                      <section>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                          Destination Details
                        </h3>
                        <div className="space-y-3">
                          <div className="flex">
                            <span className="text-sm text-gray-500 w-40">Contact Person:</span>
                            <span className="text-sm text-gray-900">{viewingDocument.destination_contact_person || 'N/A'}</span>
                          </div>
                          <div className="flex">
                            <span className="text-sm text-gray-500 w-40">Email:</span>
                            <span className="text-sm text-gray-900">{viewingDocument.destination_email || 'N/A'}</span>
                          </div>
                        </div>
                      </section>

                      {/* Files Section */}
                      <section>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                          Files
                        </h3>
                        {viewingDocument.file_name ? (
                          <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex-shrink-0">
                              <FileText size={32} className="text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {viewingDocument.file_name}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatFileSize(viewingDocument.file_size)}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No files attached</p>
                        )}
                      </section>
                    </div>
                  )}

                  {/* Original Tab Content */}
                  {activeTab === 'original' && (
                    <div className="space-y-4">
                      {viewingDocument.file_path ? (
                        <div className="bg-white rounded-lg border border-gray-200">
                          <div className="p-4 border-b border-gray-200 bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <FileText size={24} className="text-blue-600" />
                                <div>
                                  <p className="font-medium text-gray-900">{viewingDocument.file_name}</p>
                                  <p className="text-sm text-gray-500">{formatFileSize(viewingDocument.file_size)}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => downloadFile(viewingDocument.id, viewingDocument.file_name!)}
                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                              >
                                Download
                              </button>
                            </div>
                          </div>
                          <div className="p-6">
                            {viewingDocument.file_name?.toLowerCase().endsWith('.pdf') ? (
                              filePreviewUrl ? (
                                <iframe
                                  src={filePreviewUrl}
                                  className="w-full h-[600px] border-0"
                                  title="Document Preview"
                                />
                              ) : (
                                <div className="flex items-center justify-center h-[600px]">
                                  <div className="text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                    <p className="text-gray-600">Loading preview...</p>
                                  </div>
                                </div>
                              )
                            ) : (
                              <div className="text-center py-12">
                                <FileText size={64} className="text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-600 mb-4">Preview not available for this file type</p>
                                <button
                                  onClick={() => downloadFile(viewingDocument.id, viewingDocument.file_name!)}
                                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                  Download to View
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50 rounded-lg p-12 text-center">
                          <FileText size={48} className="text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600">No document available</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Report Tab Content */}
                  {activeTab === 'report' && (
                    <div className="space-y-6">
                      {viewingReport ? (
                        <>
                          {/* Purpose and Scope */}
                          <section className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                              <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
                              Purpose and Scope
                            </h3>
                            <p className="text-gray-700 leading-relaxed">{viewingReport.purpose_and_scope}</p>
                          </section>

                          {/* Summary */}
                          <section className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                              <span className="w-2 h-2 bg-green-600 rounded-full mr-3"></span>
                              Summary
                            </h3>
                            <p className="text-gray-700 leading-relaxed">{viewingReport.summary}</p>
                          </section>

                          {/* Key Highlights */}
                          <section className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                              <span className="w-2 h-2 bg-yellow-600 rounded-full mr-3"></span>
                              Key Highlights
                            </h3>
                            <ul className="space-y-2">
                              {viewingReport.highlights.map((highlight, index) => (
                                <li key={index} className="flex items-start">
                                  <span className="text-blue-600 mr-3 mt-1">•</span>
                                  <span className="text-gray-700">{highlight}</span>
                                </li>
                              ))}
                            </ul>
                          </section>

                          {/* Issues */}
                          {viewingReport.issues && (
                            <section className="bg-white rounded-lg border border-red-200 p-6">
                              <h3 className="text-lg font-semibold text-red-900 mb-3 flex items-center">
                                <span className="w-2 h-2 bg-red-600 rounded-full mr-3"></span>
                                Issues
                              </h3>
                              <div className="text-gray-700 leading-relaxed whitespace-pre-line">{viewingReport.issues}</div>
                            </section>
                          )}

                          {/* Recommendations */}
                          <section className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                              <span className="w-2 h-2 bg-purple-600 rounded-full mr-3"></span>
                              Recommendations
                            </h3>
                            <div className="text-gray-700 leading-relaxed whitespace-pre-line">{viewingReport.recommendations}</div>
                          </section>

                          {/* Report Metadata */}
                          <div className="text-sm text-gray-500 text-center pt-4 border-t border-gray-200">
                            Report generated on {formatDateTime(viewingReport.created_at)}
                          </div>

                          {/* Generate PDF Button */}
                          <div className="pt-6 flex justify-center">
                            <button
                              onClick={generateReportPDF}
                              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md"
                            >
                              <Download size={20} />
                              <span>Generate PDF Report</span>
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="bg-gray-50 rounded-lg p-12 text-center">
                          <FileText size={48} className="text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600 mb-2">No AI report available</p>
                          <p className="text-sm text-gray-500">The document may not have been processed yet</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
