-- Drop existing objects
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.user_profiles;

-- Create user_profiles table with simpler structure
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL CHECK (char_length(username) >= 3 AND username ~ '^[a-zA-Z0-9_]+$'),
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create basic policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.user_profiles;

CREATE POLICY "Enable read access for all users"
    ON public.user_profiles FOR SELECT
    USING (true);

CREATE POLICY "Enable insert for authenticated users only"
    ON public.user_profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users based on id"
    ON public.user_profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Create a simpler trigger function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    username_val TEXT;
BEGIN
    -- Extract username from metadata or generate one
    username_val := COALESCE(
        NEW.raw_user_meta_data->>'username',
        'user_' || substr(NEW.id::text, 1, 8)
    );

    -- Log the attempt
    RAISE LOG 'Creating profile for user: % with username: %', NEW.id, username_val;
    
    -- Validate username
    IF length(username_val) < 3 THEN
        RAISE EXCEPTION 'Username must be at least 3 characters long';
    END IF;

    IF NOT (username_val ~ '^[a-zA-Z0-9_]+$') THEN
        RAISE EXCEPTION 'Username can only contain letters, numbers, and underscores';
    END IF;

    -- Insert the profile with retry logic for username conflicts
    BEGIN
        INSERT INTO public.user_profiles (id, username, email)
        VALUES (NEW.id, username_val, NEW.email);
        
        RAISE LOG 'Profile created successfully for user: % with username: %', NEW.id, username_val;
    EXCEPTION 
        WHEN unique_violation THEN
            -- Try with a random suffix
            username_val := username_val || '_' || substr(md5(random()::text), 1, 4);
            
            INSERT INTO public.user_profiles (id, username, email)
            VALUES (NEW.id, username_val, NEW.email);
            
            RAISE LOG 'Profile created with modified username: % for user: %', username_val, NEW.id;
    END;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in handle_new_user: % %', SQLERRM, SQLSTATE;
        RAISE EXCEPTION 'Failed to create user profile: %', SQLERRM;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_profiles TO service_role; 