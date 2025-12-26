import { Response } from 'express';
import supabase from '../config/supabase';
import { AuthRequest } from '../middleware/auth';
import { DashboardStats } from '../types';

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    // Get total documents count
    const { count: documentsCount, error: docsError } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true });

    if (docsError) throw docsError;

    // Get total AI reports count
    const { count: reportsCount, error: reportsError } = await supabase
      .from('document_reports')
      .select('*', { count: 'exact', head: true });

    if (reportsError) throw reportsError;

    // Get total users count
    const { count: usersCount, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (usersError) throw usersError;

    // Get recent uploads (last 5)
    const { data: recentUploads, error: uploadsError } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (uploadsError) throw uploadsError;

    // Get documents by classification for analytics
    const { data: allDocuments, error: allDocsError } = await supabase
      .from('documents')
      .select('classification, document_type, created_at');

    if (allDocsError) throw allDocsError;

    // Count by classification
    const classificationCounts: Record<string, number> = {};
    const documentTypeCounts: Record<string, number> = {};
    
    allDocuments?.forEach(doc => {
      classificationCounts[doc.classification] = (classificationCounts[doc.classification] || 0) + 1;
      documentTypeCounts[doc.document_type] = (documentTypeCounts[doc.document_type] || 0) + 1;
    });

    const stats: DashboardStats = {
      total_documents: documentsCount || 0,
      total_ai_reports: reportsCount || 0,
      total_users: usersCount || 0,
      recent_uploads: recentUploads || [],
      classification_counts: classificationCounts,
      document_type_counts: documentTypeCounts
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard statistics'
    });
  }
};
