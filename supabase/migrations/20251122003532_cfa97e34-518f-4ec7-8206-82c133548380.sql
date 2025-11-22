-- Create sponsors table
CREATE TABLE IF NOT EXISTS public.sponsors (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text,
  logo_url text,
  phone text NOT NULL,
  prize_description text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on sponsors
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for sponsors (public read access)
CREATE POLICY "Anyone can view sponsors"
  ON public.sponsors
  FOR SELECT
  USING (true);

-- Create game_results table to store player game completion data
CREATE TABLE IF NOT EXISTS public.game_results (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  player_name text NOT NULL,
  player_phone text NOT NULL,
  player_email text NOT NULL,
  sponsor_id uuid NOT NULL REFERENCES public.sponsors(id) ON DELETE CASCADE,
  points integer NOT NULL DEFAULT 0,
  completed_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_game_results_sponsor_id ON public.game_results(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_game_results_points ON public.game_results(points DESC);
CREATE INDEX IF NOT EXISTS idx_game_results_player_sponsor ON public.game_results(player_name, sponsor_id);

-- Enable Row Level Security
ALTER TABLE public.game_results ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public access (game is public)
CREATE POLICY "Anyone can view game results"
  ON public.game_results
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert game results"
  ON public.game_results
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update their own game results"
  ON public.game_results
  FOR UPDATE
  USING (true)
  WITH CHECK (true);