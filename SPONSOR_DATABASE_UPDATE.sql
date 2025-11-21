-- ============================================
-- SQL para adicionar campos à tabela sponsors
-- ============================================
-- INSTRUÇÕES:
-- 1. Acesse o painel do Lovable Cloud
-- 2. Vá para Database > SQL Editor
-- 3. Execute este script SQL
-- ============================================

-- Adicionar novos campos à tabela sponsors
ALTER TABLE sponsors
ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS city TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS prize_count INTEGER NOT NULL DEFAULT 1;

-- Atualizar registros existentes com valores padrão
UPDATE sponsors
SET 
  name = COALESCE(name, 'Patrocinador'),
  city = COALESCE(city, 'Cidade'),
  prize_count = COALESCE(prize_count, 1)
WHERE name = '' OR name IS NULL;
