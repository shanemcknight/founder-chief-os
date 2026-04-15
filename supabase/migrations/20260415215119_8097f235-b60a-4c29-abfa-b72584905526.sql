
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS environment text NOT NULL DEFAULT 'sandbox',
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS api_keys_connected boolean NOT NULL DEFAULT false;

-- Set Shane as admin and production
UPDATE public.profiles
SET is_admin = true, environment = 'production'
WHERE full_name = 'Shane';
