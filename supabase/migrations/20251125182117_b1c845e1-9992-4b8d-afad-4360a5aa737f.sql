-- Remove a política restritiva existente
DROP POLICY IF EXISTS "Approved sponsors can insert their own promotions" ON public.sponsors;

-- Cria nova política que permite qualquer usuário autenticado inserir promoções
CREATE POLICY "Authenticated users can insert promotions"
ON public.sponsors
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);