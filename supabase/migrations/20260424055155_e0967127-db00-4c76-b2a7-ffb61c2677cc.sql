CREATE TABLE public.email_sequences (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references public.contacts(id) on delete cascade,
  pipeline_id uuid references public.pipelines(id) on delete set null,
  user_id uuid references auth.users not null,
  sequence_name text not null,
  sequence_step integer default 1,
  status text default 'pending',
  next_send_at timestamptz,
  last_sent_at timestamptz,
  created_at timestamptz default now()
);

ALTER TABLE public.email_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User owns sequences" ON public.email_sequences
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_email_sequences_user_id ON public.email_sequences(user_id);
CREATE INDEX idx_email_sequences_contact_id ON public.email_sequences(contact_id);
CREATE INDEX idx_email_sequences_next_send_at ON public.email_sequences(next_send_at) WHERE status = 'pending';

CREATE TABLE public.email_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  sequence_name text not null,
  sequence_step integer not null,
  subject text not null,
  body_text text not null,
  body_html text,
  delay_days integer default 7,
  created_at timestamptz default now()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User owns templates" ON public.email_templates
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_email_templates_user_seq ON public.email_templates(user_id, sequence_name, sequence_step);