-- Add latitude and longitude columns to sponsors table
ALTER TABLE public.sponsors 
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Add latitude and longitude columns to sponsor_registrations table
ALTER TABLE public.sponsor_registrations 
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Add latitude and longitude columns to pending_promotions table
ALTER TABLE public.pending_promotions 
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Create index for geolocation queries on sponsors
CREATE INDEX IF NOT EXISTS idx_sponsors_location ON public.sponsors (latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;