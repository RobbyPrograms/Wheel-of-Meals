-- Drop all existing functions to start fresh
DROP FUNCTION IF EXISTS create_post;
DROP FUNCTION IF EXISTS delete_post;
DROP FUNCTION IF EXISTS toggle_post_like;
DROP FUNCTION IF EXISTS toggle_post_repost;

-- Simple create post function
CREATE OR REPLACE FUNCTION create_post(
    p_food_id BIGINT,
    p_caption TEXT DEFAULT NULL,
    p_is_explore BOOLEAN DEFAULT TRUE
) RETURNS SETOF posts
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_post_id BIGINT;
BEGIN
    -- Insert the post and get its ID
    INSERT INTO posts (user_id, food_id, caption, is_explore)
    VALUES (auth.uid(), p_food_id, p_caption, p_is_explore)
    RETURNING id INTO v_post_id;

    -- Return the post with all its details
    RETURN QUERY
    SELECT p.*
    FROM posts p
    WHERE p.id = v_post_id;
END;
$$;

-- Simple get post details function
CREATE OR REPLACE FUNCTION get_post_details(p_post_id BIGINT)
RETURNS TABLE (
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
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.user_id,
        p.food_id,
        p.caption,
        p.created_at,
        p.is_explore,
        f.name,
        f.ingredients,
        f.recipe,
        f.meal_types,
        f.visibility,
        up.username,
        up.display_name,
        up.avatar_url,
        COALESCE((SELECT COUNT(*) FROM post_likes WHERE post_id = p.id), 0)::BIGINT,
        COALESCE((SELECT COUNT(*) FROM post_reposts WHERE post_id = p.id), 0)::BIGINT,
        EXISTS (SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = auth.uid()),
        EXISTS (SELECT 1 FROM post_reposts WHERE post_id = p.id AND user_id = auth.uid())
    FROM posts p
    JOIN favorite_foods f ON p.food_id = f.id
    JOIN user_profiles up ON p.user_id = up.user_id
    WHERE p.id = p_post_id;
END;
$$;

-- Simple delete post function
CREATE OR REPLACE FUNCTION delete_post(p_post_id BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    -- Delete the post if it belongs to the current user
    DELETE FROM posts
    WHERE id = p_post_id AND user_id = auth.uid();
    
    RETURN FOUND;
END;
$$;

-- Simple toggle like function
CREATE OR REPLACE FUNCTION toggle_post_like(p_post_id BIGINT)
RETURNS TABLE (is_liked BOOLEAN, likes_count BIGINT)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_is_liked BOOLEAN;
BEGIN
    -- Check if user has already liked the post
    SELECT EXISTS (
        SELECT 1 FROM post_likes
        WHERE post_id = p_post_id AND user_id = auth.uid()
    ) INTO v_is_liked;

    -- Toggle like
    IF v_is_liked THEN
        DELETE FROM post_likes
        WHERE post_id = p_post_id AND user_id = auth.uid();
    ELSE
        INSERT INTO post_likes (post_id, user_id)
        VALUES (p_post_id, auth.uid());
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

-- Simple toggle repost function
CREATE OR REPLACE FUNCTION toggle_post_repost(p_post_id BIGINT)
RETURNS TABLE (is_reposted BOOLEAN, reposts_count BIGINT)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_is_reposted BOOLEAN;
BEGIN
    -- Check if user has already reposted
    SELECT EXISTS (
        SELECT 1 FROM post_reposts
        WHERE post_id = p_post_id AND user_id = auth.uid()
    ) INTO v_is_reposted;

    -- Toggle repost
    IF v_is_reposted THEN
        DELETE FROM post_reposts
        WHERE post_id = p_post_id AND user_id = auth.uid();
    ELSE
        INSERT INTO post_reposts (post_id, user_id)
        VALUES (p_post_id, auth.uid());
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