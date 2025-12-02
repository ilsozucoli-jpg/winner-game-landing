-- Adicionar política para permitir leitura de configurações por usuários autenticados
CREATE POLICY "Authenticated users can view settings"
ON public.system_settings
FOR SELECT
TO authenticated
USING (true);
