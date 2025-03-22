-- Clean up everything first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- Create a simple profiles table
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,  -- Making this nullable
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create simple policies
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.user_profiles FOR SELECT
    USING (true);

CREATE POLICY "Enable insert for service role"
    ON public.user_profiles FOR INSERT
    TO service_role
    WITH CHECK (true);

CREATE POLICY "Enable update for users based on id"
    ON public.user_profiles FOR UPDATE
    USING (auth.uid() = id);

-- Grant permissions
GRANT ALL ON public.user_profiles TO service_role;
GRANT SELECT ON public.user_profiles TO authenticated;
GRANT SELECT ON public.user_profiles TO anon;

-- Create a more resilient trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    username_val TEXT;
    base_username TEXT;
    counter INTEGER := 0;
BEGIN
    -- Log the start of the function
    RAISE LOG 'handle_new_user() starting for user ID: % with email: %', NEW.id, NEW.email;
    
    -- Get base username from metadata or generate one
    base_username := COALESCE(
        NEW.raw_user_meta_data->>'username',
        'user_' || substr(NEW.id::text, 1, 8)
    );
    
    RAISE LOG 'Using base username: %', base_username;
    
    -- Initial try with base username
    username_val := base_username;
    
    -- Keep trying with incremented counter until we find a unique username or hit max retries
    WHILE counter < 5 LOOP
        BEGIN
            RAISE LOG 'Attempting to insert user profile with username: %', username_val;
            
            INSERT INTO public.user_profiles (id, username, email)
            VALUES (
                NEW.id,
                username_val,
                COALESCE(NEW.raw_user_meta_data->>'email', NEW.email)
            );
            
            RAISE LOG 'Successfully created profile for user: % with username: %', NEW.id, username_val;
            RETURN NEW;
        EXCEPTION 
            WHEN unique_violation THEN
                counter := counter + 1;
                username_val := base_username || '_' || counter;
                RAISE LOG 'Username % taken, trying %', base_username, username_val;
            WHEN OTHERS THEN
                -- Log the error but continue with fallback
                RAISE LOG 'Error in handle_new_user: % %', SQLERRM, SQLSTATE;
                
                -- Final fallback: create profile with just ID and email
                BEGIN
                    INSERT INTO public.user_profiles (id, email)
                    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'email', NEW.email));
                    RAISE LOG 'Created basic profile for user: % without username', NEW.id;
                    RETURN NEW;
                EXCEPTION 
                    WHEN OTHERS THEN
                        RAISE LOG 'Critical error in handle_new_user fallback: % %', SQLERRM, SQLSTATE;
                END;
        END;
    END LOOP;
    
    -- If we get here, we couldn't create a unique username after max retries
    -- Create profile without username as final fallback
    INSERT INTO public.user_profiles (id, email)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'email', NEW.email));
    RAISE LOG 'Created basic profile for user: % after max retries', NEW.id;
    
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
GRANT USAGE ON SCHEMA public TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role; 