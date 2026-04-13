-- Fix social_connections RLS: change from 'public' role to 'authenticated'
DROP POLICY IF EXISTS "Users can create own connections" ON public.social_connections;
DROP POLICY IF EXISTS "Users can delete own connections" ON public.social_connections;
DROP POLICY IF EXISTS "Users can update own connections" ON public.social_connections;
DROP POLICY IF EXISTS "Users can view own connections" ON public.social_connections;

CREATE POLICY "Users can view own connections" ON public.social_connections
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create own connections" ON public.social_connections
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own connections" ON public.social_connections
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own connections" ON public.social_connections
  FOR DELETE TO authenticated USING (auth.uid() = user_id);