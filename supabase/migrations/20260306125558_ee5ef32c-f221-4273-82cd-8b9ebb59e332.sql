
CREATE TABLE public.registered_cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city text NOT NULL,
  state text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(city, state)
);

ALTER TABLE public.registered_cities ENABLE ROW LEVEL SECURITY;

-- Anyone can view registered cities
CREATE POLICY "Anyone can view registered cities"
ON public.registered_cities
FOR SELECT
TO authenticated
USING (true);

-- Only admins can insert
CREATE POLICY "Admins can insert registered cities"
ON public.registered_cities
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete
CREATE POLICY "Admins can delete registered cities"
ON public.registered_cities
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
