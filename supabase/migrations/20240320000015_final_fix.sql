-- Clean up everything first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.user_profiles;

-- Create a simple profiles table with NO constraints on username
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NULL, -- Explicitly make it nullable with no constraints
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for username but allow nulls
CREATE UNIQUE INDEX user_profiles_username_idx ON public.user_profiles (username) WHERE username IS NOT NULL;

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create simple policies
CREATE POLICY "Enable read access for everyone"
    ON public.user_profiles FOR SELECT
    USING (true);

CREATE POLICY "Enable insert for service role only"
    ON public.user_profiles FOR INSERT
    TO service_role
    WITH CHECK (true);

CREATE POLICY "Enable update own profile"
    ON public.user_profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Create trigger function that handles both cases
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Insert profile with or without username from metadata
    INSERT INTO public.user_profiles (id, username, email)
    VALUES (
        NEW.id,
        (NEW.raw_user_meta_data->>'username'),
        NEW.email
    );
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        -- If username is taken, just create profile without username
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

-- Grant permissions
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON public.user_profiles TO service_role;
GRANT SELECT, UPDATE ON public.user_profiles TO authenticated;

-- Set ownership
ALTER FUNCTION public.handle_new_user() OWNER TO postgres; 