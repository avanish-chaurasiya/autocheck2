-- Create storage bucket for PDF reports
INSERT INTO storage.buckets (id, name, public)
VALUES ('evaluated-pdf-reports', 'evaluated-pdf-reports', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files
CREATE POLICY "Teachers can upload PDF reports"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'evaluated-pdf-reports' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to view their own files
CREATE POLICY "Teachers can view their own PDF reports"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'evaluated-pdf-reports' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to delete their own files
CREATE POLICY "Teachers can delete their own PDF reports"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'evaluated-pdf-reports' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access to PDF reports (for download links)
CREATE POLICY "Public can view PDF reports"
ON storage.objects
FOR SELECT
USING (bucket_id = 'evaluated-pdf-reports');