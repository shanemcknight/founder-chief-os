ALTER TABLE public.user_email_settings
  ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'America/Los_Angeles',
  ADD COLUMN IF NOT EXISTS send_window_start_hour INTEGER NOT NULL DEFAULT 9,
  ADD COLUMN IF NOT EXISTS send_window_end_hour INTEGER NOT NULL DEFAULT 16;

ALTER TABLE public.user_email_settings
  ADD CONSTRAINT user_email_settings_window_hours_check
  CHECK (
    send_window_start_hour >= 0 AND send_window_start_hour <= 23
    AND send_window_end_hour >= 1 AND send_window_end_hour <= 24
    AND send_window_start_hour < send_window_end_hour
  );