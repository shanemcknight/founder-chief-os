-- Create pipelines table
CREATE TABLE public.pipelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  stages jsonb NOT NULL DEFAULT '["New Lead","Contacted","Proposal Sent","Won","Lost"]'::jsonb,
  color text NOT NULL DEFAULT 'primary',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own pipelines" ON public.pipelines
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own pipelines" ON public.pipelines
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own pipelines" ON public.pipelines
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own pipelines" ON public.pipelines
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_pipelines_updated_at
  BEFORE UPDATE ON public.pipelines
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add pipeline_id to contacts
ALTER TABLE public.contacts
  ADD COLUMN pipeline_id uuid REFERENCES public.pipelines(id) ON DELETE SET NULL;

CREATE INDEX idx_contacts_pipeline_id ON public.contacts(pipeline_id);