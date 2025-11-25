-- Add user_id to sponsors table to link promotions to users
ALTER TABLE public.sponsors 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update RLS policy to allow approved sponsors to insert their own promotions
DROP POLICY IF EXISTS "Admins can insert sponsors" ON public.sponsors;

CREATE POLICY "Approved sponsors can insert their own promotions" 
ON public.sponsors 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM public.sponsor_registrations 
    WHERE user_id = auth.uid() 
    AND status = 'approved'
  )
);

-- Allow admins to insert any sponsor
CREATE POLICY "Admins can insert sponsors" 
ON public.sponsors 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));