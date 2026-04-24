ALTER TABLE public.email_templates
  ADD COLUMN IF NOT EXISTS send_window_start integer NOT NULL DEFAULT 8,
  ADD COLUMN IF NOT EXISTS send_window_end integer NOT NULL DEFAULT 17;

ALTER TABLE public.user_usage
  ADD COLUMN IF NOT EXISTS emails_sent_today integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_daily_reset date NOT NULL DEFAULT CURRENT_DATE;