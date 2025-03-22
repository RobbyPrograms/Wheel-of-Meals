-- Insert initial profiles for existing users
INSERT INTO public.user_profiles (id, email)
SELECT 
    id,
    email
FROM auth.users
WHERE NOT EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE user_profiles.id = users.id
);

-- Now update the usernames for any profiles that don't have them
UPDATE public.user_profiles
SET username = 'user_' || substr(id::text, 1, 8)
WHERE username IS NULL; 