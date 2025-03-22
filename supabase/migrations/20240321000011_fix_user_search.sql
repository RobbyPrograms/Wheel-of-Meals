-- Drop existing function
DROP FUNCTION IF EXISTS public.search_users;

-- Create the search_users function with current user exclusion
CREATE OR REPLACE FUNCTION public.search_users(search_query TEXT, current_user_id UUID)
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
        up.id != current_user_id
        AND (
            up.username ILIKE '%' || search_query || '%'
            OR up.display_name ILIKE '%' || search_query || '%'
            OR up.email ILIKE '%' || search_query || '%'
        )
    ORDER BY 
        CASE 
            WHEN up.username ILIKE search_query THEN 1
            WHEN up.username ILIKE search_query || '%' THEN 2
            ELSE 3
        END,
        up.username
    LIMIT 10;
$$; 