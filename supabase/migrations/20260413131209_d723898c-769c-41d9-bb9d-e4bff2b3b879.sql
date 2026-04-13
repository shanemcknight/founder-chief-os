
ALTER TABLE public.social_posts
  ADD COLUMN post_type text NOT NULL DEFAULT 'auto',
  ADD COLUMN post_notes text NOT NULL DEFAULT '';
