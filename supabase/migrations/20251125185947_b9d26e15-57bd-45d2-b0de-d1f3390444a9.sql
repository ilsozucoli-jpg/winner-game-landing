-- Remove a política que restringe INSERT apenas para admins
DROP POLICY IF EXISTS "Admins can insert sponsors" ON public.sponsors;

-- A política "Authenticated users can insert promotions" já permite
-- que qualquer usuário autenticado insira promoções onde user_id = auth.uid()