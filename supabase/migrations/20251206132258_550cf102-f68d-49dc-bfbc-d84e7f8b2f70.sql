-- Remover política existente
DROP POLICY IF EXISTS "Allow insert for admins and approved sponsors" ON public.sponsors;

-- Criar nova política que permite:
-- 1. Admins podem inserir qualquer promoção (sem restrição de user_id)
-- 2. Sponsors aprovados podem inserir apenas promoções com seu próprio user_id
CREATE POLICY "Allow insert for admins and approved sponsors"
ON public.sponsors
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR 
  (is_approved_sponsor(auth.uid()) AND user_id = auth.uid())
);