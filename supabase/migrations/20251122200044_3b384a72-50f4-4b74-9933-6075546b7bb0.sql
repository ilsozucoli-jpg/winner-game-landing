-- Create storage bucket for sponsor logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'sponsor-logos',
  'sponsor-logos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
);

-- Create storage policies for sponsor logos
CREATE POLICY "Anyone can view sponsor logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'sponsor-logos');

CREATE POLICY "Admins can upload sponsor logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'sponsor-logos' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Admins can update sponsor logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'sponsor-logos' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete sponsor logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'sponsor-logos' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);