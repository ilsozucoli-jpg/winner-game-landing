-- Tornar o bucket payment-proofs público para permitir visualização dos comprovantes
UPDATE storage.buckets 
SET public = true 
WHERE id = 'payment-proofs';