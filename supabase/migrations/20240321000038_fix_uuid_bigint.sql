-- Drop existing functions
DROP FUNCTION IF EXISTS create_post;
DROP FUNCTION IF EXISTS delete_post;

-- Create post function with proper type handling
CREATE OR REPLACE FUNCTION create_post(
    p_food_id BIGINT,
    p_caption TEXT DEFAULT NULL,
    p_is_explore BOOLEAN DEFAULT TRUE
) RETURNS TABLE (
    id BIGINT,
    user_id UUID,
    food_id BIGINT,
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
        SELECT 1 FROM favorite_foods 
        WHERE id = p_food_id AND user_id = v_user_id
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
        f.name AS food_name,
        f.ingredients AS food_ingredients,
        f.recipe AS food_recipe,
        f.meal_types AS food_meal_types,
        f.visibility AS food_visibility,
        up.username,
        up.display_name,
        up.avatar_url,
        COALESCE(l.like_count, 0)::BIGINT AS like_count,
        COALESCE(r.repost_count, 0)::BIGINT AS repost_count,
        EXISTS (
            SELECT 1 FROM post_likes pl
            WHERE pl.post_id = p.id AND pl.user_id = v_user_id
        ) AS has_liked,
        EXISTS (
            SELECT 1 FROM post_reposts pr
            WHERE pr.post_id = p.id AND pr.user_id = v_user_id
        ) AS has_reposted
    FROM posts p
    JOIN favorite_foods f ON p.food_id = f.id
    JOIN user_profiles up ON p.user_id = up.user_id
    LEFT JOIN (
        SELECT pl.post_id, COUNT(*)::BIGINT AS like_count 
        FROM post_likes pl
        GROUP BY pl.post_id
    ) l ON p.id = l.post_id
    LEFT JOIN (
        SELECT pr.post_id, COUNT(*)::BIGINT AS repost_count 
        FROM post_reposts pr
        GROUP BY pr.post_id
    ) r ON p.id = r.post_id
    WHERE p.id = v_post_id;
END;
$$;

-- Create delete post function with proper type handling
CREATE OR REPLACE FUNCTION delete_post(p_post_id BIGINT) 
RETURNS VOID 
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Get the current user's ID
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Check if post exists and belongs to the user
    IF NOT EXISTS (
        SELECT 1 FROM posts 
        WHERE id = p_post_id AND user_id = v_user_id
    ) THEN
        RAISE EXCEPTION 'Post not found or you do not have permission to delete it';
    END IF;

    -- Delete related records first
    DELETE FROM post_likes WHERE post_id = p_post_id;
    DELETE FROM post_reposts WHERE post_id = p_post_id;
    
    -- Delete the post
    DELETE FROM posts WHERE id = p_post_id AND user_id = v_user_id;
END;
$$; 