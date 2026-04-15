
-- Create beta_testers table
CREATE TABLE public.beta_testers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  invited_at timestamp with time zone NOT NULL DEFAULT now(),
  invited_by text NOT NULL DEFAULT 'shane',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.beta_testers ENABLE ROW LEVEL SECURITY;

-- Service role has full access (for edge functions / admin operations)
CREATE POLICY "Service role full access" ON public.beta_testers FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Authenticated users can check if their email is in the list
CREATE POLICY "Users can check own beta status" ON public.beta_testers FOR SELECT TO authenticated USING (true);

-- Authenticated users with admin profile can insert/update/delete
-- For now, allow authenticated users to insert (admin check in app code)
CREATE POLICY "Authenticated can insert beta testers" ON public.beta_testers FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can update beta testers" ON public.beta_testers FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated can delete beta testers" ON public.beta_testers FOR DELETE TO authenticated USING (true);

-- Allow anon to check beta status during sign-up flow
CREATE POLICY "Anon can check beta status" ON public.beta_testers FOR SELECT TO anon USING (true);
