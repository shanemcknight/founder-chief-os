
-- Social Posts
CREATE TABLE public.social_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  caption TEXT NOT NULL DEFAULT '',
  hashtags TEXT NOT NULL DEFAULT '',
  platforms TEXT[] NOT NULL DEFAULT '{}',
  post_types JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'idea',
  scheduled_date DATE,
  scheduled_time TEXT,
  media_url TEXT NOT NULL DEFAULT '',
  alt_text TEXT NOT NULL DEFAULT '',
  first_comment TEXT NOT NULL DEFAULT '',
  content_pillar UUID,
  boost_enabled BOOLEAN NOT NULL DEFAULT false,
  boost_budget NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own social posts" ON public.social_posts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own social posts" ON public.social_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own social posts" ON public.social_posts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own social posts" ON public.social_posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Content Pillars
CREATE TABLE public.social_content_pillars (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  emoji TEXT NOT NULL DEFAULT '📌',
  description TEXT NOT NULL DEFAULT '',
  best_platforms TEXT[] NOT NULL DEFAULT '{}',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.social_content_pillars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pillars" ON public.social_content_pillars FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own pillars" ON public.social_content_pillars FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pillars" ON public.social_content_pillars FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own pillars" ON public.social_content_pillars FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Add FK from posts to pillars
ALTER TABLE public.social_posts ADD CONSTRAINT fk_social_posts_pillar FOREIGN KEY (content_pillar) REFERENCES public.social_content_pillars(id) ON DELETE SET NULL;

-- Platform Guides
CREATE TABLE public.social_platform_guides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT '',
  audience TEXT NOT NULL DEFAULT '',
  tone_guide TEXT NOT NULL DEFAULT '',
  voice_keywords TEXT[] NOT NULL DEFAULT '{}',
  what_to_post TEXT[] NOT NULL DEFAULT '{}',
  what_not_to_post TEXT[] NOT NULL DEFAULT '{}',
  caption_formula TEXT NOT NULL DEFAULT '',
  cadence TEXT NOT NULL DEFAULT '',
  example_post TEXT NOT NULL DEFAULT '',
  color_hex TEXT NOT NULL DEFAULT '#3B82F6',
  icon TEXT NOT NULL DEFAULT '📱',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, platform)
);

ALTER TABLE public.social_platform_guides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own guides" ON public.social_platform_guides FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own guides" ON public.social_platform_guides FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own guides" ON public.social_platform_guides FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own guides" ON public.social_platform_guides FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Brand Voice Rules
CREATE TABLE public.social_brand_voice_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'do',
  rule TEXT NOT NULL,
  example TEXT NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.social_brand_voice_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own voice rules" ON public.social_brand_voice_rules FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own voice rules" ON public.social_brand_voice_rules FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own voice rules" ON public.social_brand_voice_rules FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own voice rules" ON public.social_brand_voice_rules FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Shot Lists
CREATE TABLE public.social_shot_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL DEFAULT 'all',
  category TEXT NOT NULL DEFAULT 'always_capture',
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  duration TEXT NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.social_shot_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own shot lists" ON public.social_shot_lists FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own shot lists" ON public.social_shot_lists FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own shot lists" ON public.social_shot_lists FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own shot lists" ON public.social_shot_lists FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Enable realtime for social_posts
ALTER PUBLICATION supabase_realtime ADD TABLE public.social_posts;

-- Updated_at triggers
CREATE OR REPLACE FUNCTION public.update_social_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_social_posts_updated_at BEFORE UPDATE ON public.social_posts FOR EACH ROW EXECUTE FUNCTION public.update_social_updated_at();
CREATE TRIGGER update_social_pillars_updated_at BEFORE UPDATE ON public.social_content_pillars FOR EACH ROW EXECUTE FUNCTION public.update_social_updated_at();
CREATE TRIGGER update_social_guides_updated_at BEFORE UPDATE ON public.social_platform_guides FOR EACH ROW EXECUTE FUNCTION public.update_social_updated_at();
CREATE TRIGGER update_social_voice_updated_at BEFORE UPDATE ON public.social_brand_voice_rules FOR EACH ROW EXECUTE FUNCTION public.update_social_updated_at();
CREATE TRIGGER update_social_shots_updated_at BEFORE UPDATE ON public.social_shot_lists FOR EACH ROW EXECUTE FUNCTION public.update_social_updated_at();
