-- Reset everything first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.user_profiles;

-- Create the profiles table
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
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.user_profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own profile"
    ON public.user_profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.user_profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Create trigger function with enhanced error handling and logging
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    username_val TEXT;
BEGIN
    -- Log the start of the function
    RAISE LOG 'handle_new_user() started for user ID: %', NEW.id;
    
    -- Extract or generate username
    username_val := COALESCE(
        (NEW.raw_user_meta_data->>'username'),
        'user_' || substr(NEW.id::text, 1, 8)
    );
    
    RAISE LOG 'Attempting to create profile with username: % for user: %', username_val, NEW.id;
    
    -- Insert with retry logic for username conflicts
    BEGIN
        INSERT INTO public.user_profiles (id, username, email)
        VALUES (
            NEW.id,
            username_val,
            NEW.email
        );
        RAISE LOG 'Successfully created user profile for ID: %', NEW.id;
    EXCEPTION 
        WHEN unique_violation THEN
            RAISE LOG 'Username conflict for %. Retrying with random suffix...', username_val;
            -- Retry with random suffix
            INSERT INTO public.user_profiles (id, username, email)
            VALUES (
                NEW.id,
                username_val || '_' || substr(md5(random()::text), 1, 4),
                NEW.email
            );
            RAISE LOG 'Created profile with modified username for ID: %', NEW.id;
        WHEN OTHERS THEN
            RAISE LOG 'Error creating user profile: % %', SQLERRM, SQLSTATE;
    END;
    
    RETURN NEW;
END;
$$;

-- Create trigger with explicit schema reference
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