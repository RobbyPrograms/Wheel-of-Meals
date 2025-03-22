-- Start fresh
BEGIN;

-- Drop everything first to ensure clean slate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.user_profiles;

-- Recreate the profiles table
CREATE TABLE public.user_profiles (
    id uuid PRIMARY KEY,
    username text,
    email text,
    display_name text,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT user_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT username_unique UNIQUE (username)
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies that allow service role to manage profiles
CREATE POLICY "Service role can manage all profiles" 
ON public.user_profiles 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Create policies for authenticated users
CREATE POLICY "Users can read own profile" 
ON public.user_profiles 
FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.user_profiles 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Backfill existing users
INSERT INTO public.user_profiles (id, email, created_at)
SELECT 
    au.id,
    au.email,
    au.created_at
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL;

COMMIT; 