-- Drop the existing table if it exists
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- Create the table with the correct structure
CREATE TABLE public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    username TEXT UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all profiles"
    ON public.user_profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update own profile"
    ON public.user_profiles FOR UPDATE
    USING (auth.uid() = id);

-- Grant permissions
GRANT ALL ON public.user_profiles TO authenticated;

-- Insert profiles for existing users
INSERT INTO public.user_profiles (id, email, username)
SELECT 
    id,
    email,
    'user_' || substr(id::text, 1, 8)
FROM auth.users;

-- Add constraints
ALTER TABLE public.user_profiles
ADD CONSTRAINT username_min_length CHECK (char_length(username) >= 3);

ALTER TABLE public.user_profiles
ADD CONSTRAINT username_valid_chars CHECK (username ~ '^[a-zA-Z0-9_]+$');

-- Make username required
ALTER TABLE public.user_profiles
ALTER COLUMN username SET NOT NULL; 