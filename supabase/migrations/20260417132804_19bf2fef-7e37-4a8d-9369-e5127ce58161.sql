-- Reports table: stores uploaded files, AI-generated analyses, and built spreadsheets
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'custom',
  file_url text,
  file_name text,
  file_type text,
  content text,
  version_of uuid REFERENCES public.reports(id) ON DELETE SET NULL,
  version_label text,
  starred boolean NOT NULL DEFAULT false,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own reports" ON public.reports
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own reports" ON public.reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own reports" ON public.reports
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own reports" ON public.reports
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_reports_user ON public.reports(user_id, created_at DESC);
CREATE INDEX idx_reports_version_of ON public.reports(version_of) WHERE version_of IS NOT NULL;

-- Report formulas table: Vault for saved Excel formulas
CREATE TABLE public.report_formulas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  formula text NOT NULL,
  plain_english text,
  category text,
  starred boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.report_formulas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own formulas" ON public.report_formulas
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own formulas" ON public.report_formulas
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own formulas" ON public.report_formulas
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own formulas" ON public.report_formulas
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_formulas_user ON public.report_formulas(user_id, created_at DESC);

-- Private storage bucket for report files (Excel, CSV, PDF)
INSERT INTO storage.buckets (id, name, public)
VALUES ('reports', 'reports', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: users can only access files in their own folder (path: <user_id>/<filename>)
CREATE POLICY "Users view own report files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'reports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload own report files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'reports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own report files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'reports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own report files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'reports' AND auth.uid()::text = (storage.foldername(name))[1]);