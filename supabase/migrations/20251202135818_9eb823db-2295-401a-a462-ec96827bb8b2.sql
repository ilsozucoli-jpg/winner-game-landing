-- Remover política existente
DROP POLICY IF EXISTS "Admins and approved sponsors can insert promotions" ON public.sponsors;

-- Criar política simplificada para INSERT que sempre permite admins
-- e verifica sponsors aprovados com user_id correspondente
CREATE POLICY "Allow insert for admins and approved sponsors"
ON public.sponsors
FOR INSERT
TO authenticated
WITH CHECK (
  (has_role(auth.uid(), 'admin'::app_role))
  OR 
  (is_approved_sponsor(auth.uid()) AND (user_id = auth.uid()))
);