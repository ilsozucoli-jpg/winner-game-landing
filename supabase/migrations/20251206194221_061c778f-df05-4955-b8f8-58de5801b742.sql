-- Create pending_promotions table for promotions awaiting admin approval
CREATE TABLE public.pending_promotions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sponsor_registration_id UUID REFERENCES public.sponsor_registrations(id),
  name TEXT,
  phone TEXT NOT NULL,
  logo_url TEXT,
  prize_description TEXT NOT NULL,
  prize_count INTEGER NOT NULL DEFAULT 1,
  promotion_end_date TIMESTAMP WITH TIME ZONE,
  city TEXT,
  state TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pending_promotions ENABLE ROW LEVEL SECURITY;

-- Sponsors can insert their own pending promotions
CREATE POLICY "Sponsors can insert own pending promotions"
ON public.pending_promotions
FOR INSERT
TO authenticated
WITH CHECK (
  is_approved_sponsor(auth.uid()) AND user_id = auth.uid()
);

-- Sponsors can view their own pending promotions
CREATE POLICY "Sponsors can view own pending promotions"
ON public.pending_promotions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admins can view all pending promotions
CREATE POLICY "Admins can view all pending promotions"
ON public.pending_promotions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete pending promotions (after approval/rejection)
CREATE POLICY "Admins can delete pending promotions"
ON public.pending_promotions
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update pending promotions status
CREATE POLICY "Admins can update pending promotions"
ON public.pending_promotions
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_pending_promotions_updated_at
BEFORE UPDATE ON public.pending_promotions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();