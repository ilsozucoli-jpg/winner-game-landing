-- Adicionar campos phone, email e validity_date à tabela sponsor_registrations
ALTER TABLE sponsor_registrations
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS validity_date TIMESTAMP WITH TIME ZONE;