-- Clean up everything first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.user_profiles;

-- Create a simple profiles table with optional username
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NULL, -- Make username optional
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create simple policies
CREATE POLICY "Enable read access for all users"
    ON public.user_profiles FOR SELECT
    USING (true);

CREATE POLICY "Enable insert for service role"
    ON public.user_profiles FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Create simple trigger function that handles both new and existing users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Simply insert the user with their email
    INSERT INTO public.user_profiles (id, email)
    VALUES (NEW.id, NEW.email);
    
    RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON public.user_profiles TO service_role;

-- Handle existing users
INSERT INTO public.user_profiles (id, email)
SELECT id, email 
FROM auth.users
ON CONFLICT (id) DO NOTHING; 