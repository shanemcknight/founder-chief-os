CREATE TABLE public.email_unsubscribes (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid REFERENCES public.contacts(id) ON DELETE CASCADE,
  email text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unsubscribed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_unsubscribes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User reads own unsubscribes"
ON public.email_unsubscribes
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role manages unsubscribes"
ON public.email_unsubscribes
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE INDEX idx_email_unsubscribes_email_user ON public.email_unsubscribes(email, user_id);
CREATE INDEX idx_email_unsubscribes_contact ON public.email_unsubscribes(contact_id);