-- Drop existing function
DROP FUNCTION IF EXISTS create_post;

-- Create post function with correct UUID type for food_id
CREATE OR REPLACE FUNCTION create_post(
    p_food_id UUID,
    p_caption TEXT DEFAULT NULL,
    p_is_explore BOOLEAN DEFAULT TRUE
) RETURNS TABLE (
    id BIGINT,
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
    like_count BIGINT,
    repost_count BIGINT,
    has_liked BOOLEAN,
    has_reposted BOOLEAN
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_user_id UUID;
    v_post_id BIGINT;
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
    INSERT INTO posts (user_id, food_id, caption, is_explore)
    VALUES (v_user_id, p_food_id, p_caption, p_is_explore)
    RETURNING id INTO v_post_id;

    -- Return the complete post data
    RETURN QUERY
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
        COALESCE((SELECT COUNT(*) FROM post_likes WHERE post_id = p.id), 0)::BIGINT AS like_count,
        COALESCE((SELECT COUNT(*) FROM post_reposts WHERE post_id = p.id), 0)::BIGINT AS repost_count,
        EXISTS (SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = v_user_id) AS has_liked,
        EXISTS (SELECT 1 FROM post_reposts WHERE post_id = p.id AND user_id = v_user_id) AS has_reposted
    FROM posts p
    JOIN favorite_foods ff ON p.food_id = ff.id
    JOIN user_profiles up ON p.user_id = up.user_id
    WHERE p.id = v_post_id;
END;
$$; 