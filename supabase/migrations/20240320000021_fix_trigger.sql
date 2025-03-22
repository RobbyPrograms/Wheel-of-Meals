-- First, make sure we have the right table structure
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recreate the user_profiles table to ensure correct structure
DROP TABLE IF EXISTS public.user_profiles;
CREATE TABLE public.user_profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username text UNIQUE,
    email text,
    display_name text,
    created_at timestamp with time zone DEFAULT now()
);

-- Create the function that will handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    raw_email text;
    raw_username text;
BEGIN
    -- Extract email and username from metadata
    raw_email := COALESCE(NEW.email, NEW.raw_user_meta_data->>'email');
    raw_username := NEW.raw_user_meta_data->>'username';

    -- Insert the new profile
    INSERT INTO public.user_profiles (id, email, username)
    VALUES (
        NEW.id,
        raw_email,
        raw_username
    );

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error (this will appear in your Supabase logs)
        RAISE LOG 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Set up RLS policies
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile"
    ON public.user_profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
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

-- Create or replace the username availability check function
CREATE OR REPLACE FUNCTION public.check_username_availability(username text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1 
        FROM public.user_profiles 
        WHERE user_profiles.username = check_username_availability.username
    );
END;
$$; 