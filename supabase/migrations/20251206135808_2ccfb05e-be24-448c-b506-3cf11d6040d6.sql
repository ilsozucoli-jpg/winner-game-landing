-- Adicionar campos para controle de prêmios ganhos
ALTER TABLE public.game_results 
ADD COLUMN IF NOT EXISTS is_winner boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS prize_claimed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS user_id uuid;

-- Criar índice para buscar resultados por user_id
CREATE INDEX IF NOT EXISTS idx_game_results_user_id ON public.game_results(user_id);

-- Criar índice para buscar vencedores
CREATE INDEX IF NOT EXISTS idx_game_results_winner ON public.game_results(is_winner) WHERE is_winner = true;