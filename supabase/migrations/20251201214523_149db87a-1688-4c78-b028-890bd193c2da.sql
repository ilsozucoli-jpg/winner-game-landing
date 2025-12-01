-- Add sponsor_registration_id column to sponsors table
ALTER TABLE public.sponsors 
ADD COLUMN sponsor_registration_id uuid REFERENCES public.sponsor_registrations(id);