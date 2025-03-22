-- Insert profiles for existing users who don't have one
INSERT INTO public.user_profiles (id, username, email)
SELECT 
    users.id,
    'user_' || substr(users.id::text, 1, 8),
    users.email
FROM auth.users users
LEFT JOIN public.user_profiles profiles ON users.id = profiles.id
WHERE profiles.id IS NULL;

-- Add an index on username for faster searches
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles(username);

-- Add an index on email for faster searches
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email); 