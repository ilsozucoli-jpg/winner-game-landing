-- Add terms acceptance tracking to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_terms_accepted 
ON public.profiles(terms_accepted_at) 
WHERE terms_accepted_at IS NOT NULL;