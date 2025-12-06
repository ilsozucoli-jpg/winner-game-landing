-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Allow insert for admins and approved sponsors" ON public.sponsors;

-- Create a new PERMISSIVE INSERT policy
CREATE POLICY "Allow insert for admins and approved sponsors" 
ON public.sponsors 
FOR INSERT 
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  OR (is_approved_sponsor(auth.uid()) AND (user_id = auth.uid()))
);