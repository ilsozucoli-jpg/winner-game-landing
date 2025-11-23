-- Adicionar campos de data final da promoção e quantidade de prêmios
ALTER TABLE public.sponsors
ADD COLUMN IF NOT EXISTS promotion_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS prize_count INTEGER NOT NULL DEFAULT 1;