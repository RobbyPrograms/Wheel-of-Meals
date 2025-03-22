-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.get_friends;

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