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

-- Create more permissive policies
CREATE POLICY "Profiles are viewable by everyone" 
    ON public.user_profiles 
    FOR SELECT USING (true);

CREATE POLICY "Anyone can create profiles"
    ON public.user_profiles
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update their own profile"
    ON public.user_profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Create the function to handle new user creation with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    new_username TEXT;
    base_username TEXT;
    counter INT := 0;
BEGIN
    RAISE LOG 'handle_new_user() starting for user ID: % with email: %', NEW.id, NEW.email;
    
    -- Get base username from metadata or generate one
    base_username := COALESCE(
        NEW.raw_user_meta_data->>'username',
        'user_' || substr(NEW.id::text, 1, 8)
    );
    
    RAISE LOG 'Using base username: %', base_username;
    
    -- Initial try with base username
    new_username := base_username;
    
    -- Keep trying with incremented counter until we find a unique username
    WHILE counter < 10 LOOP
        BEGIN
            RAISE LOG 'Attempting to insert user profile with username: %', new_username;
            
            INSERT INTO public.user_profiles (id, username, email)
            VALUES (NEW.id, new_username, NEW.email);
            
            RAISE LOG 'Successfully created profile for user: % with username: %', NEW.id, new_username;
            EXIT;
        EXCEPTION WHEN unique_violation THEN
            counter := counter + 1;
            new_username := base_username || '_' || counter;
            RAISE LOG 'Username % taken, trying %', base_username, new_username;
        WHEN OTHERS THEN
            RAISE LOG 'Error creating profile: % %', SQLERRM, SQLSTATE;
            RETURN NULL;
        END;
    END LOOP;
    
    IF counter >= 10 THEN
        RAISE LOG 'Failed to find unique username after 10 attempts for user: %', NEW.id;
        RETURN NULL;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions (more permissive)
ALTER TABLE public.user_profiles OWNER TO postgres;
GRANT ALL ON public.user_profiles TO postgres;
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_profiles TO service_role;
GRANT ALL ON public.user_profiles TO anon;

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant function execution permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon; 