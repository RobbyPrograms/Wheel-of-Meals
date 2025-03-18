-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;

-- Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL CHECK (char_length(username) >= 3 AND username ~ '^[a-zA-Z0-9_]+$'),
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for username searches
DROP INDEX IF EXISTS user_profiles_username_idx;
CREATE INDEX user_profiles_username_idx ON user_profiles (username);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all profiles"
    ON user_profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update their own profile"
    ON user_profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON user_profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, username, created_at, updated_at)
    VALUES (
        NEW.id,
        COALESCE(
            (NEW.raw_user_meta_data->>'username'),
            'user_' || substr(NEW.id::text, 1, 8)
        ),
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET username = EXCLUDED.username,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to search users
DROP FUNCTION IF EXISTS search_users(TEXT);
CREATE OR REPLACE FUNCTION public.search_users(search_query TEXT)
RETURNS TABLE (
    id UUID,
    username TEXT,
    display_name TEXT,
    avatar_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.username,
        p.display_name,
        p.avatar_url
    FROM user_profiles p
    WHERE 
        p.username ILIKE '%' || search_query || '%'
        OR COALESCE(p.display_name, '') ILIKE '%' || search_query || '%'
    LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 