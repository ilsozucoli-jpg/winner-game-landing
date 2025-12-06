-- Remover política existente de INSERT
DROP POLICY IF EXISTS "Sponsors can insert own pending promotions" ON public.pending_promotions;

-- Criar nova política de INSERT para admins e patrocinadores aprovados
CREATE POLICY "Allow insert for admins and approved sponsors"
ON public.pending_promotions
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  OR (is_approved_sponsor(auth.uid()) AND user_id = auth.uid())
);