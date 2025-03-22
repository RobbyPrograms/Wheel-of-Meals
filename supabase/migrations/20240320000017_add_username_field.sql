-- Drop existing table and policies
DROP POLICY IF EXISTS "Enable read access for everyone" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.user_profiles;
DROP TABLE IF EXISTS public.user_profiles;

-- Create the profiles table with username
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,  -- Making it nullable but unique when present
    email TEXT NOT NULL,
    display_name TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create function to generate unique username
CREATE OR REPLACE FUNCTION generate_unique_username(base_username TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    new_username TEXT;
    counter INT := 0;
BEGIN
    -- First try the base username
    new_username := base_username;
    
    -- Keep trying with incremental numbers until we find a unique one
    WHILE EXISTS (SELECT 1 FROM public.user_profiles WHERE username = new_username) LOOP
        counter := counter + 1;
        new_username := base_username || counter;
    END LOOP;
    
    RETURN new_username;
END;
$$;

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for everyone"
    ON public.user_profiles FOR SELECT
    USING (true);

CREATE POLICY "Enable insert for authenticated users"
    ON public.user_profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users based on id"
    ON public.user_profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.user_profiles TO authenticated;

-- Create function to check username availability
CREATE OR REPLACE FUNCTION check_username_availability(username TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1 
        FROM public.user_profiles 
        WHERE LOWER(user_profiles.username) = LOWER(check_username_availability.username)
    );
END;
$$; 