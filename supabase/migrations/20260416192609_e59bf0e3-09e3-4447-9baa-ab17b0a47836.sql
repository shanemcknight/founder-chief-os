UPDATE public.profiles 
SET is_admin = true, approved = true, environment = 'production'
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'shane@tophatprovisions.com'
);