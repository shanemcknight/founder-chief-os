-- Create user_usage table
CREATE TABLE public.user_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null unique,
  plan_tier text not null default 'SCOUT',
  email_monthly_limit integer not null default 500,
  emails_sent_this_month integer not null default 0,
  api_token_monthly_limit integer not null default 50000,
  api_tokens_used_this_month integer not null default 0,
  billing_cycle_start date not null default current_date,
  byok_active boolean not null default false,
  updated_at timestamptz default now()
);

ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User reads own usage" ON public.user_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role manages usage" ON public.user_usage
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- check_email_limit function
CREATE OR REPLACE FUNCTION public.check_email_limit(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT emails_sent_this_month < email_monthly_limit
     FROM public.user_usage WHERE user_id = _user_id),
    false
  );
$$;

-- increment_email_count function
CREATE OR REPLACE FUNCTION public.increment_email_count(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_usage
  SET emails_sent_this_month = emails_sent_this_month + 1,
      updated_at = now()
  WHERE user_id = _user_id;
END;
$$;

-- Seed user_usage on new user signup (extend handle_new_user)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');

  INSERT INTO public.user_usage (user_id, plan_tier, email_monthly_limit, api_token_monthly_limit)
  VALUES (NEW.id, 'SCOUT', 500, 50000)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Backfill rows for existing users
INSERT INTO public.user_usage (user_id, plan_tier, email_monthly_limit, api_token_monthly_limit)
SELECT id, 'SCOUT', 500, 50000 FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- Enable extensions for cron scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Monthly reset cron job
SELECT cron.schedule(
  'reset-monthly-usage',
  '0 0 1 * *',
  $$ UPDATE public.user_usage SET emails_sent_this_month = 0, api_tokens_used_this_month = 0, updated_at = now() $$
);