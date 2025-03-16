-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL CHECK (length(username) >= 3),
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create friends table
CREATE TABLE IF NOT EXISTS friends (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, friend_id)
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

-- Policies for user_profiles
CREATE POLICY "Users can view all profiles"
    ON user_profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON user_profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Policies for friends
CREATE POLICY "Users can view their friends"
    ON friends FOR SELECT
    TO authenticated
    USING (
        auth.uid() = user_id OR 
        auth.uid() = friend_id
    );

CREATE POLICY "Users can add friends"
    ON friends FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their friend status"
    ON friends FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Function to search users
CREATE OR REPLACE FUNCTION search_users(search_query TEXT)
RETURNS SETOF user_profiles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM user_profiles
    WHERE 
        username ILIKE '%' || search_query || '%'
        OR display_name ILIKE '%' || search_query || '%'
    LIMIT 10;
END;
$$;

-- Function to get friends
CREATE OR REPLACE FUNCTION get_friends(p_user_id UUID)
RETURNS TABLE (
    friend_id UUID,
    username TEXT,
    email TEXT,
    display_name TEXT,
    avatar_url TEXT,
    status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN f.user_id = p_user_id THEN f.friend_id
            ELSE f.user_id
        END as friend_id,
        p.username,
        u.email,
        p.display_name,
        p.avatar_url,
        f.status
    FROM friends f
    JOIN auth.users u ON (
        CASE 
            WHEN f.user_id = p_user_id THEN f.friend_id
            ELSE f.user_id
        END = u.id
    )
    JOIN user_profiles p ON p.id = u.id
    WHERE 
        (f.user_id = p_user_id OR f.friend_id = p_user_id)
        AND f.status = 'accepted';
END;
$$;

-- Trigger to create user profile on signup
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO user_profiles (id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$;

-- Create the trigger
CREATE OR REPLACE TRIGGER create_profile_after_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_profile_for_user(); 