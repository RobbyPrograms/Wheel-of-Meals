-- Drop existing functions
DROP FUNCTION IF EXISTS create_post;
DROP FUNCTION IF EXISTS delete_post;
DROP FUNCTION IF EXISTS toggle_post_like;
DROP FUNCTION IF EXISTS toggle_post_repost;

-- Create post function with correct UUID types
CREATE OR REPLACE FUNCTION create_post(
    p_food_id UUID,
    p_caption TEXT DEFAULT NULL,
    p_is_explore BOOLEAN DEFAULT TRUE
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
    is_reposted BOOLEAN
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
    INSERT INTO posts (user_id, food_id, caption, is_explore)
    VALUES (v_user_id, p_food_id, p_caption, p_is_explore)
    RETURNING posts.id INTO v_post_id;

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
        COALESCE((SELECT COUNT(*)::BIGINT FROM post_likes pl WHERE pl.post_id = p.id), 0) AS likes_count,
        COALESCE((SELECT COUNT(*)::BIGINT FROM post_reposts pr WHERE pr.post_id = p.id), 0) AS reposts_count,
        EXISTS (SELECT 1 FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = v_user_id) AS is_liked,
        EXISTS (SELECT 1 FROM post_reposts pr WHERE pr.post_id = p.id AND pr.user_id = v_user_id) AS is_reposted
    FROM posts p
    JOIN favorite_foods ff ON p.food_id = ff.id
    JOIN user_profiles up ON p.user_id = up.user_id
    WHERE p.id = v_post_id;
END;
$$;

-- Create toggle like function with UUID types
CREATE OR REPLACE FUNCTION toggle_post_like(p_post_id UUID)
RETURNS TABLE (is_liked BOOLEAN, likes_count BIGINT)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_user_id UUID;
    v_is_liked BOOLEAN;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Check if post exists
    IF NOT EXISTS (SELECT 1 FROM posts WHERE id = p_post_id) THEN
        RAISE EXCEPTION 'Post not found';
    END IF;

    -- Check if already liked
    SELECT EXISTS (
        SELECT 1 FROM post_likes 
        WHERE post_id = p_post_id AND user_id = v_user_id
    ) INTO v_is_liked;

    -- Toggle like
    IF v_is_liked THEN
        DELETE FROM post_likes 
        WHERE post_id = p_post_id AND user_id = v_user_id;
    ELSE
        INSERT INTO post_likes (post_id, user_id)
        VALUES (p_post_id, v_user_id);
    END IF;

    -- Return new state
    RETURN QUERY
    SELECT 
        NOT v_is_liked,
        COUNT(*)::BIGINT
    FROM post_likes
    WHERE post_id = p_post_id;
END;
$$;

-- Create toggle repost function with UUID types
CREATE OR REPLACE FUNCTION toggle_post_repost(p_post_id UUID)
RETURNS TABLE (is_reposted BOOLEAN, reposts_count BIGINT)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_user_id UUID;
    v_is_reposted BOOLEAN;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Check if post exists
    IF NOT EXISTS (SELECT 1 FROM posts WHERE id = p_post_id) THEN
        RAISE EXCEPTION 'Post not found';
    END IF;

    -- Check if already reposted
    SELECT EXISTS (
        SELECT 1 FROM post_reposts 
        WHERE post_id = p_post_id AND user_id = v_user_id
    ) INTO v_is_reposted;

    -- Toggle repost
    IF v_is_reposted THEN
        DELETE FROM post_reposts 
        WHERE post_id = p_post_id AND user_id = v_user_id;
    ELSE
        INSERT INTO post_reposts (post_id, user_id)
        VALUES (p_post_id, v_user_id);
    END IF;

    -- Return new state
    RETURN QUERY
    SELECT 
        NOT v_is_reposted,
        COUNT(*)::BIGINT
    FROM post_reposts
    WHERE post_id = p_post_id;
END;
$$;

-- Create delete post function with UUID types
CREATE OR REPLACE FUNCTION delete_post(p_post_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Delete the post if it belongs to the current user
    DELETE FROM posts
    WHERE id = p_post_id AND user_id = v_user_id;
    
    RETURN FOUND;
END;
$$; 