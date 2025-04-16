-- Drop existing create_post function
DROP FUNCTION IF EXISTS create_post;

-- Create updated post function with properly qualified column references
CREATE OR REPLACE FUNCTION create_post(
    p_food_id UUID,
    p_caption TEXT DEFAULT NULL,
    p_is_explore BOOLEAN DEFAULT TRUE,
    p_image_url TEXT DEFAULT NULL
) RETURNS TABLE (
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
    image_url TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_user_id UUID;
    v_post_id UUID;
BEGIN
    -- Get the current user's ID
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    
    -- Verify the food item exists and belongs to the user
    IF NOT EXISTS (
        SELECT 1 FROM favorite_foods ff
        WHERE ff.id = p_food_id AND ff.user_id = v_user_id
    ) THEN
        RAISE EXCEPTION 'Food item not found or does not belong to user';
    END IF;

    -- Insert the post
    INSERT INTO posts (user_id, food_id, caption, is_explore, image_url)
    VALUES (v_user_id, p_food_id, p_caption, p_is_explore, p_image_url)
    RETURNING posts.id INTO v_post_id;

    -- Return the complete post data with properly qualified column references
    RETURN QUERY
    WITH post_likes_count AS (
        SELECT pl.post_id, COUNT(*)::BIGINT AS like_count 
        FROM post_likes pl
        GROUP BY pl.post_id
    ),
    post_reposts_count AS (
        SELECT pr.post_id, COUNT(*)::BIGINT AS repost_count 
        FROM post_reposts pr
        GROUP BY pr.post_id
    )
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
        COALESCE(plc.like_count, 0)::BIGINT AS likes_count,
        COALESCE(prc.repost_count, 0)::BIGINT AS reposts_count,
        EXISTS (
            SELECT 1 FROM post_likes pl
            WHERE pl.post_id = p.id AND pl.user_id = v_user_id
        ) AS is_liked,
        EXISTS (
            SELECT 1 FROM post_reposts pr
            WHERE pr.post_id = p.id AND pr.user_id = v_user_id
        ) AS is_reposted,
        p.image_url
    FROM posts p
    JOIN favorite_foods ff ON p.food_id = ff.id
    JOIN user_profiles up ON p.user_id = up.user_id
    LEFT JOIN post_likes_count plc ON p.id = plc.post_id
    LEFT JOIN post_reposts_count prc ON p.id = prc.post_id
    WHERE p.id = v_post_id;
END;
$$; 