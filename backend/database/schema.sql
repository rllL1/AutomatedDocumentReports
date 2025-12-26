-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  department VARCHAR(255),
  division VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference_number VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  classification VARCHAR(100) NOT NULL,
  document_type VARCHAR(100) NOT NULL,
  summary_basis VARCHAR(100) NOT NULL,
  division_office VARCHAR(255) NOT NULL,
  sender_contact_person VARCHAR(255),
  sender_email VARCHAR(255),
  destination_office VARCHAR(255) NOT NULL,
  destination_contact_person VARCHAR(255),
  destination_email VARCHAR(255),
  file_path TEXT NOT NULL,
  file_name VARCHAR(500) NOT NULL,
  file_size INTEGER,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document reports table
CREATE TABLE IF NOT EXISTS document_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  purpose_and_scope TEXT,
  summary TEXT,
  highlights JSONB,
  issues TEXT,
  recommendations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Utilities table
CREATE TABLE IF NOT EXISTS utilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(100) NOT NULL CHECK (type IN ('classification', 'document_type', 'summary_basis', 'division_office', 'destination_office')),
  value VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(type, value)
);

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Authenticated users can view documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents');

CREATE POLICY "Authenticated users can delete documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents');

-- Row Level Security policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE utilities ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own data"
ON users FOR SELECT
TO authenticated
USING (true);

-- Documents policies
CREATE POLICY "Users can view all documents"
ON documents FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert documents"
ON documents FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Admins can update documents"
ON documents FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Admins can delete documents"
ON documents FOR DELETE
TO authenticated
USING (true);

-- Document reports policies
CREATE POLICY "Users can view all reports"
ON document_reports FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert reports"
ON document_reports FOR INSERT
TO authenticated
WITH CHECK (true);

-- Utilities policies
CREATE POLICY "Users can view utilities"
ON utilities FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage utilities"
ON utilities FOR ALL
TO authenticated
USING (true);

-- Create indexes
CREATE INDEX idx_documents_reference ON documents(reference_number);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX idx_document_reports_document_id ON document_reports(document_id);
CREATE INDEX idx_utilities_type ON utilities(type);

-- Insert default utilities
INSERT INTO utilities (type, value, description) VALUES
  ('classification', 'Confidential', 'Confidential documents'),
  ('classification', 'Internal', 'Internal use only'),
  ('classification', 'Public', 'Public documents'),
  ('document_type', 'Memorandum', 'Official memorandum'),
  ('document_type', 'Letter', 'Official letter'),
  ('document_type', 'Report', 'Report document'),
  ('document_type', 'Policy', 'Policy document'),
  ('summary_basis', 'Executive Summary', 'High-level overview'),
  ('summary_basis', 'Technical Analysis', 'Detailed technical review'),
  ('summary_basis', 'Legal Review', 'Legal perspective analysis'),
  ('division_office', 'Human Resources', 'HR Department'),
  ('division_office', 'Finance', 'Finance Department'),
  ('division_office', 'IT', 'IT Department'),
  ('division_office', 'Operations', 'Operations Department'),
  ('destination_office', 'Executive Office', 'Executive management'),
  ('destination_office', 'Board of Directors', 'Board level'),
  ('destination_office', 'Legal Department', 'Legal team')
ON CONFLICT (type, value) DO NOTHING;
