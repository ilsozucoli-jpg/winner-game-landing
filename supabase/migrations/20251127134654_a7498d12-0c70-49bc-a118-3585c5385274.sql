-- Drop política existente
DROP POLICY IF EXISTS "Authenticated users can insert promotions" ON public.sponsors;

-- Criar nova política que permite apenas admins e patrocinadores aprovados
CREATE POLICY "Admins and approved sponsors can insert promotions"
ON public.sponsors
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.is_approved_sponsor(auth.uid())
);