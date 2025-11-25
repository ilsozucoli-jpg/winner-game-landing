-- Create a security definer function to check if user is an approved sponsor
-- This avoids RLS recursion issues
CREATE OR REPLACE FUNCTION public.is_approved_sponsor(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.sponsor_registrations
    WHERE user_id = _user_id
      AND status = 'approved'
  )
$$;

-- Drop the existing policy that might be causing issues
DROP POLICY IF EXISTS "Approved sponsors can insert their own promotions" ON public.sponsors;

-- Create new policy using the security definer function
CREATE POLICY "Approved sponsors can insert their own promotions"
ON public.sponsors
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND public.is_approved_sponsor(auth.uid())
);