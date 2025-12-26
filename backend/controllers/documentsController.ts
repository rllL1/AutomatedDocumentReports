import { Response } from 'express';
import supabase from '../config/supabase';
import { AuthRequest } from '../middleware/auth';
import { extractTextFromBuffer, generateDocumentSummary } from '../services/aiService';

export const getAllDocuments = async (req: AuthRequest, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch documents'
    });
  }
};

export const getDocumentById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();

    if (docError) throw docError;

    // Get associated report
    const { data: report, error: reportError } = await supabase
      .from('document_reports')
      .select('*')
      .eq('document_id', id)
      .single();

    res.json({
      success: true,
      data: {
        document,
        report: reportError ? null : report
      }
    });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch document'
    });
  }
};

export const uploadAndProcessDocument = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }

    const {
      title,
      classification,
      document_type,
      division_office,
      sender_contact_person,
      sender_email,
      destination_office,
      destination_contact_person,
      destination_email
    } = req.body;

    // Validate required fields
    if (!title || !classification || !document_type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Auto-generate reference number with format REF-YYYY-MM-DD-XXXXXX
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    const reference_number = `REF-${dateStr}-${randomStr}`;

    // Upload file to Supabase Storage
    const fileExt = req.file.originalname.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `documents/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error('Failed to upload file to storage');
    }

    // Extract text from document
    let extractedText: string;
    try {
      extractedText = await extractTextFromBuffer(
        req.file.buffer,
        req.file.mimetype,
        req.file.originalname
      );
    } catch (error) {
      console.error('Text extraction error:', error);
      // Delete uploaded file if extraction fails
      await supabase.storage.from('documents').remove([filePath]);
      return res.status(400).json({
        success: false,
        error: 'Failed to extract text from document. Please ensure the file is not corrupted.'
      });
    }

    // Generate AI summary
    let aiReport;
    try {
      aiReport = await generateDocumentSummary(extractedText);
    } catch (error) {
      console.error('AI generation error:', error);
      // Delete uploaded file if AI processing fails
      await supabase.storage.from('documents').remove([filePath]);
      return res.status(500).json({
        success: false,
        error: 'Failed to generate AI summary. Please try again.'
      });
    }

    // Insert document record
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        reference_number,
        title,
        classification,
        document_type,
        division_office,
        sender_contact_person,
        sender_email,
        destination_office,
        destination_contact_person,
        destination_email,
        file_path: filePath,
        file_name: req.file.originalname,
        file_size: req.file.size,
        uploaded_by: req.user.id
      })
      .select()
      .single();

    if (docError) {
      console.error('Document insert error:', docError);
      // Delete uploaded file if database insert fails
      await supabase.storage.from('documents').remove([filePath]);
      throw docError;
    }

    // Insert AI report
    const { error: reportError } = await supabase
      .from('document_reports')
      .insert({
        document_id: document.id,
        purpose_and_scope: aiReport.purposeAndScope,
        summary: aiReport.summary,
        highlights: aiReport.highlights,
        issues: aiReport.issues,
        recommendations: aiReport.recommendations
      })
      .select()
      .single();

    if (reportError) {
      console.error('Report insert error:', reportError);
    }

    res.json({
      success: true,
      document,
      aiReport: {
        purposeAndScope: aiReport.purposeAndScope,
        summary: aiReport.summary,
        highlights: aiReport.highlights,
        issues: aiReport.issues,
        recommendations: aiReport.recommendations
      }
    });
  } catch (error) {
    console.error('Upload and process error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload and process document'
    });
  }
};

export const deleteDocument = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Get document to retrieve file path
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('file_path')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Delete file from storage
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([document.file_path]);

    if (storageError) {
      console.error('Storage delete error:', storageError);
    }

    // Delete document record (cascade will delete report)
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete document'
    });
  }
};

export const downloadDocument = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Get document details
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('file_path, file_name')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Download file from storage
    const { data, error: downloadError } = await supabase.storage
      .from('documents')
      .download(document.file_path);

    if (downloadError) throw downloadError;

    // Convert blob to buffer
    const buffer = Buffer.from(await data.arrayBuffer());

    // Set headers for file download
    res.setHeader('Content-Type', data.type);
    res.setHeader('Content-Disposition', `attachment; filename="${document.file_name}"`);
    res.setHeader('Content-Length', buffer.length);

    // Send file
    res.send(buffer);
  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download document'
    });
  }
};
