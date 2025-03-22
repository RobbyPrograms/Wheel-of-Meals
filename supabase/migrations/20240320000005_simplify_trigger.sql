-- First, clean up any existing objects
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- Create the profiles table with proper constraints
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY,
    username TEXT UNIQUE NOT NULL CHECK (char_length(username) >= 3 AND username ~ '^[a-zA-Z0-9_]+$'),
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add foreign key after table creation
ALTER TABLE public.user_profiles 
    ADD CONSTRAINT user_profiles_id_fkey 
    FOREIGN KEY (id) REFERENCES auth.users(id) 
    ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.user_profiles;
DROP POLICY IF EXISTS "Anyone can create profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;

-- Create simplified policies
CREATE POLICY "Enable read access for all users"
    ON public.user_profiles FOR SELECT
    USING (true);

CREATE POLICY "Enable insert for service role only"
    ON public.user_profiles FOR INSERT
    TO service_role
    WITH CHECK (true);

CREATE POLICY "Enable update for users based on id"
    ON public.user_profiles FOR UPDATE
    USING (auth.uid() = id);

-- Create simplified trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    username_val TEXT;
BEGIN
    -- Get username from metadata or generate one
    username_val := COALESCE(
        NEW.raw_user_meta_data->>'username',
        'user_' || substr(NEW.id::text, 1, 8)
    );

    -- Simple insert with no retries
    INSERT INTO public.user_profiles (id, username, email)
    VALUES (
        NEW.id,
        username_val,
        NEW.email
    );

    RETURN NEW;
EXCEPTION WHEN unique_violation THEN
    -- If username exists, try with a random suffix
    INSERT INTO public.user_profiles (id, username, email)
    VALUES (
        NEW.id,
        username_val || '_' || substr(md5(random()::text), 1, 4),
        NEW.email
    );
    RETURN NEW;
WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user: % %', SQLERRM, SQLSTATE;
    RETURN NULL;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon, service_role;
GRANT ALL ON public.user_profiles TO authenticated, service_role;
GRANT SELECT ON public.user_profiles TO anon;

-- Grant sequence permissions if any
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;

-- Set search path for the function
ALTER FUNCTION public.handle_new_user() SET search_path TO public; 