-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own friend connections" ON public.friends;
DROP POLICY IF EXISTS "Users can send friend requests" ON public.friends;
DROP POLICY IF EXISTS "Users can accept/reject friend requests" ON public.friends;
DROP POLICY IF EXISTS "Users can delete their own friend connections" ON public.friends;

-- Create friends table if it doesn't exist
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

-- Create policies
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

-- Grant permissions
GRANT ALL ON public.friends TO authenticated;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.get_friends;
DROP FUNCTION IF EXISTS public.search_users;

-- Create the search_users function
CREATE OR REPLACE FUNCTION public.search_users(search_query TEXT)
RETURNS TABLE (
    id UUID,
    username TEXT,
    email TEXT,
    display_name TEXT,
    avatar_url TEXT
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT 
        up.id,
        up.username,
        up.email,
        up.display_name,
        up.avatar_url
    FROM public.user_profiles up
    WHERE 
        up.username ILIKE '%' || search_query || '%'
        OR up.display_name ILIKE '%' || search_query || '%'
        OR up.email ILIKE '%' || search_query || '%'
    ORDER BY 
        CASE 
            WHEN up.username ILIKE search_query THEN 1
            WHEN up.username ILIKE search_query || '%' THEN 2
            ELSE 3
        END,
        up.username
    LIMIT 10;
$$;

-- Create the get_friends function with proper status handling
CREATE OR REPLACE FUNCTION public.get_friends(p_user_id UUID)
RETURNS TABLE (
    friend_id UUID,
    username TEXT,
    email TEXT,
    display_name TEXT,
    avatar_url TEXT,
    status TEXT,
    is_sender BOOLEAN
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
        f.status,
        f.user_id = p_user_id AS is_sender
    FROM public.friends f
    JOIN public.user_profiles up ON (
        CASE 
            WHEN f.user_id = p_user_id THEN f.friend_id
            ELSE f.user_id
        END = up.id
    )
    WHERE 
        (f.user_id = p_user_id OR f.friend_id = p_user_id)
    ORDER BY 
        CASE 
            WHEN f.status = 'pending' AND f.friend_id = p_user_id THEN 1  -- Pending requests to me first
            WHEN f.status = 'pending' AND f.user_id = p_user_id THEN 2    -- My pending requests second
            WHEN f.status = 'accepted' THEN 3                             -- Accepted friends third
            ELSE 4                                                        -- Everything else last
        END,
        up.username;
$$; 