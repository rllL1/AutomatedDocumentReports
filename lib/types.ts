// API Response interfaces
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  error?: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    full_name: string;
    role: string;
    is_active?: boolean;
  };
  session: {
    access_token: string;
    refresh_token?: string;
  };
}

export interface AiReport {
  purpose_and_scope?: string;
  purposeAndScope?: string;
  summary: string;
  highlights: string[];
  issues: string;
  recommendations: string;
}

export interface DocumentUploadResponse {
  document: unknown;
  aiReport: AiReport;
}

export interface DashboardStats {
  totalDocuments: number;
  recentDocuments: number;
  pendingReview: number;
  totalUsers: number;
}
