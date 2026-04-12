
CREATE OR REPLACE FUNCTION public.seed_social_defaults()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Default content pillars
  INSERT INTO public.social_content_pillars (user_id, name, color, emoji, description, best_platforms, sort_order)
  VALUES
    (NEW.id, 'Formula', '#3B82F6', '🧪', 'Step-by-step tutorials, how-tos, and repeatable frameworks your audience can follow.', ARRAY['ig','tt','li'], 0),
    (NEW.id, 'Story', '#F59E0B', '📖', 'Behind-the-scenes moments, personal wins, lessons learned, and founder journey posts.', ARRAY['ig','fb','li'], 1),
    (NEW.id, 'Partnership', '#10B981', '🤝', 'Collaborations, client spotlights, testimonials, and community features.', ARRAY['ig','fb','pinterest'], 2);

  -- Default brand voice rules
  INSERT INTO public.social_brand_voice_rules (user_id, rule, type, example, sort_order)
  VALUES
    (NEW.id, 'Write in first person, conversational tone', 'do', 'e.g. "Here''s what I learned after 6 months…"', 0),
    (NEW.id, 'Use storytelling hooks in the first line', 'do', 'e.g. "Nobody talks about this part of running a business…"', 1),
    (NEW.id, 'Avoid corporate jargon or buzzwords', 'dont', 'e.g. Don''t say "synergy" or "leverage" — keep it human', 2);

  -- Default shot list items
  INSERT INTO public.social_shot_lists (user_id, title, description, category, platform, duration, sort_order)
  VALUES
    (NEW.id, 'Desk setup & workspace', 'Quick pan of your workspace — great for Reels or Stories.', 'always_capture', 'ig', '15-30s', 0),
    (NEW.id, 'Product in action', 'Film yourself using the product or service in real time.', 'always_capture', 'all', '30-60s', 1),
    (NEW.id, 'Customer reaction / unboxing', 'Capture genuine reactions — works well as testimonial content.', 'planned', 'tt', '15-45s', 2);

  RETURN NEW;
END;
$$;

-- Trigger on new user creation
CREATE TRIGGER on_new_user_seed_social
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.seed_social_defaults();
