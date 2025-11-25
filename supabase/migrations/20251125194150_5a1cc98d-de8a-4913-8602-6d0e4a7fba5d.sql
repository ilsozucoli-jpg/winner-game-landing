-- Criar política para permitir que patrocinadores aprovados insiram promoções
CREATE POLICY "Approved sponsors can insert promotions" 
ON public.sponsors 
FOR INSERT 
TO authenticated
WITH CHECK (is_approved_sponsor(auth.uid()));