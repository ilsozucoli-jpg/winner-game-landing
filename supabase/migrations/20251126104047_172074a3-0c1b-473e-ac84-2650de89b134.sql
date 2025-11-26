-- Atualizar política RLS para permitir que admins e usuários autenticados insiram promoções
DROP POLICY IF EXISTS "Anyone can insert promotions" ON public.sponsors;

CREATE POLICY "Authenticated users can insert promotions" 
ON public.sponsors 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Garantir que admins podem atualizar qualquer promoção
DROP POLICY IF EXISTS "Admins can update sponsors" ON public.sponsors;

CREATE POLICY "Admins can update sponsors" 
ON public.sponsors 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Garantir que admins podem deletar promoções
DROP POLICY IF EXISTS "Admins can delete sponsors" ON public.sponsors;

CREATE POLICY "Admins can delete sponsors" 
ON public.sponsors 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'));