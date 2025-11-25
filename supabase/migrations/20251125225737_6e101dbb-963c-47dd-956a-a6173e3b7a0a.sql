-- Remove a política restritiva atual
DROP POLICY IF EXISTS "Approved sponsors can insert promotions" ON public.sponsors;

-- Criar nova política que permite qualquer usuário autenticado inserir promoções
CREATE POLICY "Anyone can insert promotions" 
ON public.sponsors 
FOR INSERT 
TO authenticated
WITH CHECK (true);