-- Remover política RESTRICTIVE existente
DROP POLICY IF EXISTS "Admins and approved sponsors can insert promotions" ON public.sponsors;

-- Criar política PERMISSIVE para INSERT
CREATE POLICY "Admins and approved sponsors can insert promotions"
ON public.sponsors
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  OR (is_approved_sponsor(auth.uid()) AND user_id = auth.uid())
);