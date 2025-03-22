-- First, clean up any existing objects (with safety checks)
DO $$ 
BEGIN
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    DROP FUNCTION IF EXISTS public.handle_new_user();
    
    -- Only drop the table if it exists and we want to recreate it
    IF EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'user_profiles'
    ) THEN
        DROP TABLE public.user_profiles CASCADE;
    END IF;
END $$;

-- Create the profiles table with proper constraints
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY,
    username TEXT UNIQUE,  -- Making this nullable initially
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT username_length CHECK (
        username IS NULL OR 
        (char_length(username) >= 3 AND username ~ '^[a-zA-Z0-9_]+$')
    )
);

-- Add foreign key after table creation
ALTER TABLE public.user_profiles 
    ADD CONSTRAINT user_profiles_id_fkey 
    FOREIGN KEY (id) REFERENCES auth.users(id) 
    ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create more permissive policies
CREATE POLICY "Enable full access for service role"
    ON public.user_profiles
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable select for authenticated users"
    ON public.user_profiles
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable select for anonymous users"
    ON public.user_profiles
    FOR SELECT
    TO anon
    USING (true);

-- Create simplified trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Simple insert with basic username generation
    INSERT INTO public.user_profiles (id, username, email)
    VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data->>'username',
            'user_' || substr(NEW.id::text, 1, 8)
        ),
        NEW.email
    );
    
    -- Always return NEW to ensure the trigger succeeds
    RETURN NEW;
EXCEPTION 
    WHEN unique_violation THEN
        -- On username conflict, try with random suffix
        INSERT INTO public.user_profiles (id, username, email)
        VALUES (
            NEW.id,
            'user_' || substr(md5(random()::text), 1, 8),
            NEW.email
        );
        RETURN NEW;
    WHEN OTHERS THEN
        -- On any other error, create profile with just ID and email
        INSERT INTO public.user_profiles (id, email)
        VALUES (NEW.id, NEW.email);
        RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON public.user_profiles TO authenticated;
GRANT SELECT ON public.user_profiles TO anon;

-- Ensure existing users have profiles
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN 
        SELECT id, email, raw_user_meta_data->>'username' as username
        FROM auth.users
        WHERE id NOT IN (SELECT id FROM public.user_profiles)
    LOOP
        BEGIN
            INSERT INTO public.user_profiles (id, username, email)
            VALUES (
                user_record.id,
                COALESCE(
                    user_record.username,
                    'user_' || substr(user_record.id::text, 1, 8)
                ),
                user_record.email
            );
        EXCEPTION WHEN unique_violation THEN
            -- If username is taken, try with a random suffix
            INSERT INTO public.user_profiles (id, username, email)
            VALUES (
                user_record.id,
                COALESCE(
                    user_record.username,
                    'user_' || substr(user_record.id::text, 1, 8)
                ) || '_' || substr(md5(random()::text), 1, 4),
                user_record.email
            );
        END;
    END LOOP;
END $$; 