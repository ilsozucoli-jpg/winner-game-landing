-- Criar tabela de configurações do sistema
CREATE TABLE IF NOT EXISTS public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Política para admins lerem configurações
CREATE POLICY "Admins can view settings"
ON public.system_settings
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Política para admins atualizarem configurações
CREATE POLICY "Admins can update settings"
ON public.system_settings
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Política para admins inserirem configurações
CREATE POLICY "Admins can insert settings"
ON public.system_settings
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Inserir configuração inicial (cadastros habilitados por padrão)
INSERT INTO public.system_settings (setting_key, setting_value)
VALUES ('promotions_registration_enabled', '{"enabled": true}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;

-- Adicionar colunas city e state na tabela sponsors
ALTER TABLE public.sponsors 
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text;