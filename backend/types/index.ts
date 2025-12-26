export interface User {
  id: string;
  email: string;
  full_name: string;
  department?: string;
  division?: string;
  role: 'admin' | 'user';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  reference_number: string;
  title: string;
  classification: string;
  document_type: string;
  summary_basis: string;
  division_office: string;
  sender_contact_person: string;
  sender_email: string;
  destination_office: string;
  destination_contact_person: string;
  destination_email: string;
  file_path: string;
  file_name: string;
  file_size: number;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentReport {
  id: string;
  document_id: string;
  overview: string;
  basis: string;
  key_points: string[];
  findings: string;
  conclusion: string;
  created_at: string;
}

export interface Utility {
  id: string;
  type: 'classification' | 'document_type' | 'summary_basis' | 'division_office' | 'destination_office';
  value: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  total_documents: number;
  total_ai_reports: number;
  total_users: number;
  recent_uploads: Document[];
  classification_counts?: Record<string, number>;
  document_type_counts?: Record<string, number>;
}

export interface AIReportResponse {
  purposeAndScope: string;
  summary: string;
  highlights: string[];
  issues: string;
  recommendations: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
