-- Add replied_at to email_sequences
ALTER TABLE public.email_sequences
  ADD COLUMN IF NOT EXISTS replied_at timestamptz;

-- Add subject, body, metadata to activities (for richer activity logging)
ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS subject text,
  ADD COLUMN IF NOT EXISTS body text,
  ADD COLUMN IF NOT EXISTS metadata jsonb;

-- Webhook idempotency table
CREATE TABLE IF NOT EXISTS public.webhook_events_processed (
  svix_id text PRIMARY KEY,
  processed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.webhook_events_processed ENABLE ROW LEVEL SECURITY;

-- Only the service role writes/reads this table; no user policies needed.
-- Add a restrictive service-role policy for clarity.
DROP POLICY IF EXISTS "Service role manages webhook events" ON public.webhook_events_processed;
CREATE POLICY "Service role manages webhook events"
  ON public.webhook_events_processed
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);