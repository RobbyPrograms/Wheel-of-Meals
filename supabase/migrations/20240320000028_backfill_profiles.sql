-- Backfill profiles for existing users
INSERT INTO public.user_profiles (id, email, created_at)
SELECT 
    au.id,
    au.email,
    au.created_at
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL;

-- Verify the insertion
SELECT * FROM public.user_profiles; 