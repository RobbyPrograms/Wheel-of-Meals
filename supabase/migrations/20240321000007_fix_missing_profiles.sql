-- Create profiles for any users that don't have them
INSERT INTO public.user_profiles (id, email, username)
SELECT 
    id,
    email,
    'user_' || substr(id::text, 1, 8)
FROM auth.users
WHERE NOT EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE user_profiles.id = users.id
); 