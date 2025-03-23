-- Drop and recreate get_friends_posts function with correct join
DROP FUNCTION IF EXISTS get_friends_posts;

CREATE OR REPLACE FUNCTION get_friends_posts()
RETURNS TABLE (
    id UUID,
    user_id UUID,
    food_id UUID,
    caption TEXT,
    created_at TIMESTAMPTZ,
    is_explore BOOLEAN,
    food_name TEXT,
    food_ingredients TEXT[],
    food_recipe TEXT,
    food_meal_types TEXT[],
    food_visibility TEXT,
    username TEXT,
    display_name TEXT,
    avatar_url TEXT,
    likes_count BIGINT,
    reposts_count BIGINT,
    is_liked BOOLEAN,
    is_reposted BOOLEAN,
    reposted_by_username TEXT,
    reposted_by_display_name TEXT,
    repost_created_at TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    RETURN QUERY
    WITH friends AS (
        -- Get all friends (both directions)
        SELECT 
            CASE 
                WHEN user_id_1 = v_user_id THEN user_id_2
                ELSE user_id_1
            END AS friend_id
        FROM friendships
        WHERE 
            (user_id_1 = v_user_id OR user_id_2 = v_user_id)
            AND status = 'accepted'
    ),
    post_data AS (
        -- Original posts from friends
        SELECT 
            p.id,
            p.user_id,
            p.food_id,
            p.caption,
            p.created_at,
            p.is_explore,
            ff.name AS food_name,
            ff.ingredients AS food_ingredients,
            ff.recipe AS food_recipe,
            ff.meal_types AS food_meal_types,
            ff.visibility AS food_visibility,
            up.username,
            up.display_name,
            up.avatar_url,
            NULL::TEXT AS reposted_by_username,
            NULL::TEXT AS reposted_by_display_name,
            NULL::TIMESTAMPTZ AS repost_created_at
        FROM posts p
        JOIN favorite_foods ff ON p.food_id = ff.id
        JOIN user_profiles up ON p.user_id = up.id  -- Changed from up.user_id to up.id
        JOIN friends f ON p.user_id = f.friend_id

        UNION ALL

        -- Reposts by friends
        SELECT 
            p.id,
            p.user_id,
            p.food_id,
            p.caption,
            p.created_at,
            p.is_explore,
            ff.name AS food_name,
            ff.ingredients AS food_ingredients,
            ff.recipe AS food_recipe,
            ff.meal_types AS food_meal_types,
            ff.visibility AS food_visibility,
            up.username,
            up.display_name,
            up.avatar_url,
            rup.username AS reposted_by_username,
            rup.display_name AS reposted_by_display_name,
            pr.created_at AS repost_created_at
        FROM posts p
        JOIN favorite_foods ff ON p.food_id = ff.id
        JOIN user_profiles up ON p.user_id = up.id  -- Changed from up.user_id to up.id
        JOIN post_reposts pr ON p.id = pr.post_id
        JOIN friends f ON pr.user_id = f.friend_id
        JOIN user_profiles rup ON pr.user_id = rup.id  -- Changed from rup.user_id to rup.id
    )
    SELECT 
        pd.*,
        COALESCE((SELECT COUNT(*)::BIGINT FROM post_likes pl WHERE pl.post_id = pd.id), 0) AS likes_count,
        COALESCE((SELECT COUNT(*)::BIGINT FROM post_reposts pr WHERE pr.post_id = pd.id), 0) AS reposts_count,
        EXISTS (SELECT 1 FROM post_likes pl WHERE pl.post_id = pd.id AND pl.user_id = v_user_id) AS is_liked,
        EXISTS (SELECT 1 FROM post_reposts pr WHERE pr.post_id = pd.id AND pr.user_id = v_user_id) AS is_reposted
    FROM post_data pd
    ORDER BY 
        COALESCE(pd.repost_created_at, pd.created_at) DESC;
END;
$$; 