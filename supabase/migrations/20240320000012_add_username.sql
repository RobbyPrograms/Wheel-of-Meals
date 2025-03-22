-- Clean up everything first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.user_profiles;

-- Create a simple profiles table with username
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
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

-- Create simple trigger function that generates a username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    base_username TEXT;
    final_username TEXT;
    counter INT := 0;
BEGIN
    -- Generate base username from email
    base_username := split_part(NEW.email, '@', 1);
    final_username := base_username;
    
    -- Keep trying with counter until we find a unique username
    WHILE counter < 10 LOOP
        BEGIN
            INSERT INTO public.user_profiles (id, username, email)
            VALUES (NEW.id, final_username, NEW.email);
            RETURN NEW;
        EXCEPTION WHEN unique_violation THEN
            counter := counter + 1;
            final_username := base_username || counter;
        END;
    END LOOP;
    
    -- If we get here, just use the user's id as username
    INSERT INTO public.user_profiles (id, username, email)
    VALUES (NEW.id, 'user_' || substr(NEW.id::text, 1, 8), NEW.email);
    
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