-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.get_friends;

-- Create the get_friends function
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