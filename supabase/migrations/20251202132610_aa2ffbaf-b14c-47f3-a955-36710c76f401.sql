-- Drop existing INSERT policy if exists
DROP POLICY IF EXISTS "Admins and approved sponsors can insert promotions" ON public.sponsors;

-- Create a permissive INSERT policy for admins and approved sponsors
CREATE POLICY "Admins and approved sponsors can insert promotions"
ON public.sponsors
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  OR (is_approved_sponsor(auth.uid()) AND user_id = auth.uid())
);

-- Also allow sponsors to update their own promotions
DROP POLICY IF EXISTS "Sponsors can update own promotions" ON public.sponsors;

CREATE POLICY "Sponsors can update own promotions"
ON public.sponsors
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR (is_approved_sponsor(auth.uid()) AND user_id = auth.uid())
);