
CREATE TABLE public.user_email_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  from_name text NOT NULL DEFAULT 'My Business',
  from_email text,
  domain_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_email_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User owns email settings"
  ON public.user_email_settings
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_user_email_settings_updated_at
  BEFORE UPDATE ON public.user_email_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Remove any existing per-user Resend API keys
DELETE FROM public.api_keys WHERE service = 'resend';
