-- Drop the RESTRICTIVE policy and recreate as PERMISSIVE
DROP POLICY IF EXISTS "Allow insert for admins and approved sponsors" ON public.pending_promotions;

CREATE POLICY "Allow insert for admins and approved sponsors"
ON public.pending_promotions
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  (is_approved_sponsor(auth.uid()) AND user_id = auth.uid())
);