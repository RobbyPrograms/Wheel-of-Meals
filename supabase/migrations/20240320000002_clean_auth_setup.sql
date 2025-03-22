-- First, clean up any existing objects
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- Create the profiles table with proper constraints
CREATE TABLE public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL CHECK (char_length(username) >= 3 AND username ~ '^[a-zA-Z0-9_]+$'),
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Profiles are viewable by everyone" 
    ON public.user_profiles 
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile"
    ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role can create profiles"
    ON public.user_profiles
    FOR INSERT WITH CHECK (true);

-- Create the function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    new_username TEXT;
    base_username TEXT;
    counter INT := 0;
BEGIN
    -- Get base username from metadata or generate one
    base_username := COALESCE(
        NEW.raw_user_meta_data->>'username',
        'user_' || substr(NEW.id::text, 1, 8)
    );
    
    -- Initial try with base username
    new_username := base_username;
    
    -- Keep trying with incremented counter until we find a unique username
    WHILE counter < 10 LOOP
        BEGIN
            INSERT INTO public.user_profiles (id, username, email)
            VALUES (NEW.id, new_username, NEW.email);
            -- If insert succeeds, exit the loop
            EXIT;
        EXCEPTION WHEN unique_violation THEN
            -- If username exists, try with a counter
            counter := counter + 1;
            new_username := base_username || '_' || counter;
            -- Continue loop
        END;
    END LOOP;
    
    -- If we couldn't find a unique username after 10 tries, raise an error
    IF counter >= 10 THEN
        RAISE EXCEPTION 'Could not generate a unique username after 10 attempts';
    END IF;
    
    RETURN NEW;
EXCEPTION WHEN others THEN
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
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role; 