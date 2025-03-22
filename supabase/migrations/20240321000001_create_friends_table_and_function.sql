-- First ensure user_profiles table has all required fields
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drop existing table if it exists
DROP TABLE IF EXISTS public.friends CASCADE;

-- Create friends table
CREATE TABLE IF NOT EXISTS public.friends (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, friend_id),
    CONSTRAINT no_self_friendship CHECK (user_id != friend_id)
);

-- Enable RLS
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for friends table
CREATE POLICY "Users can view their own friend connections"
    ON public.friends FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can send friend requests"
    ON public.friends FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can accept/reject friend requests"
    ON public.friends FOR UPDATE
    USING (auth.uid() = friend_id)
    WITH CHECK (status IN ('accepted', 'rejected'));

CREATE POLICY "Users can delete their own friend connections"
    ON public.friends FOR DELETE
    USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Create policies for user_profiles table
CREATE POLICY "Users can view all profiles"
    ON public.user_profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update own profile"
    ON public.user_profiles FOR UPDATE
    USING (auth.uid() = id);

-- Grant permissions
GRANT ALL ON public.friends TO authenticated;
GRANT ALL ON public.user_profiles TO authenticated;

-- Now create the get_friends function
DROP FUNCTION IF EXISTS public.get_friends;

CREATE OR REPLACE FUNCTION public.get_friends(p_user_id UUID)
RETURNS TABLE (
    friend_id UUID,
    username TEXT,
    email TEXT,
    display_name TEXT,
    avatar_url TEXT,
    status TEXT
) 
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT 
        CASE 
            WHEN f.user_id = p_user_id THEN f.friend_id
            ELSE f.user_id
        END AS friend_id,
        up.username,
        up.email,
        up.display_name,
        up.avatar_url,
        f.status
    FROM public.friends f
    JOIN public.user_profiles up ON (
        CASE 
            WHEN f.user_id = p_user_id THEN f.friend_id
            ELSE f.user_id
        END = up.id
    )
    WHERE 
        (f.user_id = p_user_id OR f.friend_id = p_user_id);
$$;

-- Create trigger to update user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, username, email)
    VALUES (
        NEW.id,
        'user_' || substr(NEW.id::text, 1, 8),
        NEW.email
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 