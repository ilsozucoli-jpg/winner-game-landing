-- Dropar políticas de INSERT existentes e recriar
DROP POLICY IF EXISTS "Authenticated users can upload sponsor logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload payment proofs" ON storage.objects;

-- Recriar políticas de INSERT para sponsor-logos
CREATE POLICY "Authenticated users can upload sponsor logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'sponsor-logos' AND auth.role() = 'authenticated');

-- Recriar políticas de INSERT para payment-proofs
CREATE POLICY "Authenticated users can upload payment proofs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'payment-proofs' AND auth.role() = 'authenticated');