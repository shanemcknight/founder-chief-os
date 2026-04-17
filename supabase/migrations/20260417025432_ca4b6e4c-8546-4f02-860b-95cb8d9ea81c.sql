-- Create companies table
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  industry text,
  website text,
  location text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own companies" ON public.companies
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own companies" ON public.companies
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own companies" ON public.companies
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own companies" ON public.companies
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_companies_user_id ON public.companies(user_id);

-- Create contacts table
CREATE TABLE public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  title text,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  stage text NOT NULL DEFAULT 'new_lead',
  value numeric NOT NULL DEFAULT 0,
  location text,
  tags text[] NOT NULL DEFAULT '{}',
  notes text,
  last_contacted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own contacts" ON public.contacts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own contacts" ON public.contacts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own contacts" ON public.contacts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own contacts" ON public.contacts
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_contacts_user_id ON public.contacts(user_id);
CREATE INDEX idx_contacts_company_id ON public.contacts(company_id);
CREATE INDEX idx_contacts_stage ON public.contacts(stage);

-- Create activities table
CREATE TABLE public.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE CASCADE,
  type text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own activities" ON public.activities
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own activities" ON public.activities
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own activities" ON public.activities
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own activities" ON public.activities
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_activities_contact_id ON public.activities(contact_id);
CREATE INDEX idx_activities_user_id ON public.activities(user_id);

-- Create crm_tasks table
CREATE TABLE public.crm_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE CASCADE,
  title text NOT NULL,
  due_date timestamptz,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own crm tasks" ON public.crm_tasks
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own crm tasks" ON public.crm_tasks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own crm tasks" ON public.crm_tasks
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own crm tasks" ON public.crm_tasks
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_crm_tasks_user_id ON public.crm_tasks(user_id);
CREATE INDEX idx_crm_tasks_contact_id ON public.crm_tasks(contact_id);
CREATE INDEX idx_crm_tasks_due_date ON public.crm_tasks(due_date) WHERE completed = false;

-- Enable realtime for contacts
ALTER PUBLICATION supabase_realtime ADD TABLE public.contacts;