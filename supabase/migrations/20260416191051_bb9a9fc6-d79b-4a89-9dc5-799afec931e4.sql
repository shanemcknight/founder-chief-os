-- Create email_accounts table for multi-account email support
create table public.email_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  provider text not null check (provider in ('outlook', 'gmail')),
  email_address text not null,
  display_name text,
  nango_connection_id text not null,
  is_active boolean default true,
  last_synced_at timestamptz,
  created_at timestamptz default now(),
  unique(user_id, nango_connection_id)
);

alter table public.email_accounts enable row level security;

create policy "Users own their email accounts"
  on public.email_accounts for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Add columns to emails table
alter table public.emails
  add column if not exists email_account_id uuid references public.email_accounts(id) on delete set null,
  add column if not exists account_email text;

-- Migrate existing Outlook connections from user_integrations
insert into public.email_accounts (user_id, provider, email_address, display_name, nango_connection_id, last_synced_at)
select
  user_id,
  'outlook' as provider,
  coalesce(nango_connection_id, 'unknown@outlook.com') as email_address,
  'Outlook' as display_name,
  nango_connection_id,
  last_synced_at
from public.user_integrations
where provider = 'outlook'
  and nango_connection_id is not null
on conflict (user_id, nango_connection_id) do nothing;