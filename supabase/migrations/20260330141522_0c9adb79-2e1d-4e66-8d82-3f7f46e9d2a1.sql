-- Create game_play table to track game stage progress per player
CREATE TABLE IF NOT EXISTS public.game_play (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  game_token text NOT NULL UNIQUE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sponsor_id uuid REFERENCES public.sponsors(id) ON DELETE SET NULL,
  current_stage integer NOT NULL DEFAULT 0 CHECK (current_stage >= 0 AND current_stage <= 9),
  total_points integer NOT NULL DEFAULT 0,
  stage_points integer[] NOT NULL DEFAULT ARRAY[0,0,0,0,0,0,0,0,0,0]::integer[],
  stage_tokens text[] NOT NULL DEFAULT ARRAY[NULL::text,NULL::text,NULL::text,NULL::text,NULL::text,NULL::text,NULL::text,NULL::text,NULL::text,NULL::text]::text[],
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  abandon_reason text CHECK (abandon_reason IN ('Token jogo divergente', 'Token da etapa divergente', 'Tempo excedido', 'Pontos excedidos', 'Jogo duplicado', 'Outros')),
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CHECK (status != 'abandoned' OR abandon_reason IS NOT NULL),
  CHECK (status = 'abandoned' OR abandon_reason IS NULL),
  CHECK (array_length(stage_points, 1) = 10),
  CHECK (array_length(stage_tokens, 1) = 10)
);

CREATE INDEX IF NOT EXISTS idx_game_play_user_id ON public.game_play(user_id);
CREATE INDEX IF NOT EXISTS idx_game_play_sponsor_id ON public.game_play(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_game_play_status ON public.game_play(status);

ALTER TABLE public.game_play ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can insert their own game play"
  ON public.game_play
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Players can select their own game play"
  ON public.game_play
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Players can update their own game play"
  ON public.game_play
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Players can delete their own game play"
  ON public.game_play
  FOR DELETE
  USING (
    auth.uid() = user_id
    AND stage_points = ARRAY[0,0,0,0,0,0,0,0,0,0]::integer[]
    AND stage_tokens = ARRAY[NULL::text,NULL::text,NULL::text,NULL::text,NULL::text,NULL::text,NULL::text,NULL::text,NULL::text,NULL::text]::text[]
  );

CREATE POLICY "Admins can select all game play"
  ON public.game_play
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all game play"
  ON public.game_play
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete game play"
  ON public.game_play
  FOR DELETE
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    AND stage_points = ARRAY[0,0,0,0,0,0,0,0,0,0]::integer[]
    AND stage_tokens = ARRAY[NULL::text,NULL::text,NULL::text,NULL::text,NULL::text,NULL::text,NULL::text,NULL::text,NULL::text,NULL::text]::text[]
  );

CREATE OR REPLACE FUNCTION public.enforce_game_play_stage_immutability()
RETURNS trigger AS $$
DECLARE
  idx integer;
BEGIN
  FOR idx IN 1..10 LOOP
    IF OLD.stage_points[idx] IS NOT NULL AND OLD.stage_points[idx] <> 0 THEN
      IF NEW.stage_points[idx] IS DISTINCT FROM OLD.stage_points[idx] THEN
        RAISE EXCEPTION 'Stage % points cannot be modified once set', idx;
      END IF;
    END IF;
    IF OLD.stage_tokens[idx] IS NOT NULL THEN
      IF NEW.stage_tokens[idx] IS DISTINCT FROM OLD.stage_tokens[idx] THEN
        RAISE EXCEPTION 'Stage % token cannot be modified once set', idx;
      END IF;
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER enforce_game_play_stage_immutability
  BEFORE UPDATE ON public.game_play
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_game_play_stage_immutability();

CREATE TRIGGER update_game_play_updated_at
  BEFORE UPDATE ON public.game_play
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.game_play (
  id,
  game_token,
  user_id,
  sponsor_id,
  current_stage,
  total_points,
  stage_points,
  stage_tokens,
  status,
  started_at,
  completed_at,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  'test-game-token-0001',
  u.id,
  (SELECT id FROM public.sponsors ORDER BY created_at LIMIT 1),
  9,
  1187,
  ARRAY[120,95,110,105,98,130,140,112,127,150]::integer[],
  ARRAY[
    'token-stage-1','token-stage-2','token-stage-3','token-stage-4','token-stage-5',
    'token-stage-6','token-stage-7','token-stage-8','token-stage-9','token-stage-10'
  ]::text[],
  'completed',
  now() - interval '10 minutes',
  now(),
  now(),
  now()
FROM auth.users u
LIMIT 1
ON CONFLICT (game_token) DO NOTHING;
