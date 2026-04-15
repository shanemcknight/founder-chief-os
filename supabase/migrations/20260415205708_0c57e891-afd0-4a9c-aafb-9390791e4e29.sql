
-- Drop overly permissive policies
DROP POLICY "Authenticated can insert beta testers" ON public.beta_testers;
DROP POLICY "Authenticated can update beta testers" ON public.beta_testers;
DROP POLICY "Authenticated can delete beta testers" ON public.beta_testers;

-- Create admin-only function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
    AND full_name = 'Shane'
  )
$$;

-- Admin-only write policies
CREATE POLICY "Admins can insert beta testers" ON public.beta_testers FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update beta testers" ON public.beta_testers FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete beta testers" ON public.beta_testers FOR DELETE TO authenticated USING (public.is_admin());
