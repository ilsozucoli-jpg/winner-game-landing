-- Adicionar políticas RLS para admins gerenciarem patrocinadores
CREATE POLICY "Admins can insert sponsors"
ON public.sponsors
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update sponsors"
ON public.sponsors
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete sponsors"
ON public.sponsors
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));