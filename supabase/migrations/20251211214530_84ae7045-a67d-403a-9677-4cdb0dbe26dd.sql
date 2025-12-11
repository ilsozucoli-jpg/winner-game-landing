-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Only approved sponsors can insert pending promotions" ON public.pending_promotions;

-- Create new permissive INSERT policy for any authenticated user
CREATE POLICY "Authenticated users can insert pending promotions" 
ON public.pending_promotions 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());