-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create sponsor_registrations table
CREATE TABLE IF NOT EXISTS public.sponsor_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  company TEXT NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('test', 'monthly', 'annual')),
  plan_value DECIMAL(10,2) NOT NULL,
  payment_proof_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sponsor_registrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sponsor_registrations
CREATE POLICY "Users can insert their own sponsor registration"
ON public.sponsor_registrations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own sponsor registration"
ON public.sponsor_registrations
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own sponsor registration"
ON public.sponsor_registrations
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sponsor registrations"
ON public.sponsor_registrations
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all sponsor registrations"
ON public.sponsor_registrations
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for payment proofs
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for payment-proofs bucket
CREATE POLICY "Users can upload their own payment proofs"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'payment-proofs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own payment proofs"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'payment-proofs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all payment proofs"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'payment-proofs' AND
  has_role(auth.uid(), 'admin'::app_role)
);

-- Create trigger for updating updated_at
CREATE TRIGGER update_sponsor_registrations_updated_at
BEFORE UPDATE ON public.sponsor_registrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();