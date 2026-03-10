
-- Create support_messages table
CREATE TABLE public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  sponsor_registration_id uuid REFERENCES public.sponsor_registrations(id) ON DELETE CASCADE NOT NULL,
  promotion_id uuid NOT NULL,
  promotion_name text NOT NULL,
  subject text NOT NULL CHECK (subject IN ('Elogio', 'Solicitação', 'Sugestão', 'Esclarecimento', 'Outros')),
  message text NOT NULL,
  attachment_url text,
  is_read boolean NOT NULL DEFAULT false,
  admin_reply text,
  admin_replied_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Sponsors can insert their own messages
CREATE POLICY "Sponsors can insert own messages"
  ON public.support_messages FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Sponsors can view their own messages
CREATE POLICY "Sponsors can view own messages"
  ON public.support_messages FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can view all messages
CREATE POLICY "Admins can view all messages"
  ON public.support_messages FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update messages (mark read, reply)
CREATE POLICY "Admins can update messages"
  ON public.support_messages FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for message attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('message-attachments', 'message-attachments', true);

-- Storage policies for message attachments
CREATE POLICY "Anyone can view message attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'message-attachments');

CREATE POLICY "Authenticated users can upload message attachments"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'message-attachments');

-- Trigger for updated_at
CREATE TRIGGER handle_support_messages_updated_at
  BEFORE UPDATE ON public.support_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
