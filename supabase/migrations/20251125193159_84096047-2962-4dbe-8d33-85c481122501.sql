-- Remove todas as políticas de INSERT na tabela sponsors
DROP POLICY IF EXISTS "Authenticated users can insert promotions" ON public.sponsors;