alter table public.profiles add column if not exists openai_api_key text;
alter table public.profiles add column if not exists gemini_api_key text;