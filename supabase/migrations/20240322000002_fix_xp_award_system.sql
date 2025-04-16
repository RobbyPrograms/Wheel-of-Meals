-- First, drop existing triggers and functions
DROP TRIGGER IF EXISTS posts_xp_trigger ON posts;
DROP TRIGGER IF EXISTS post_likes_xp_trigger ON post_likes;
DROP FUNCTION IF EXISTS handle_post_interaction();

-- Create the post interaction handler function
CREATE OR REPLACE FUNCTION handle_post_interaction() RETURNS TRIGGER AS $$
BEGIN
    -- Award XP for different actions
    CASE TG_TABLE_NAME
        WHEN 'posts' THEN
            -- Creating a new recipe post
            IF TG_OP = 'INSERT' THEN
                PERFORM award_experience_points(NEW.user_id, 50);
            END IF;
        WHEN 'post_likes' THEN
            -- Getting likes on posts
            IF TG_OP = 'INSERT' THEN
                -- Award XP to the post creator
                PERFORM award_experience_points(
                    (SELECT user_id FROM posts WHERE id = NEW.post_id),
                    10
                );
            END IF;
    END CASE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for various interactions
CREATE TRIGGER posts_xp_trigger
    AFTER INSERT ON posts
    FOR EACH ROW
    EXECUTE FUNCTION handle_post_interaction();

CREATE TRIGGER post_likes_xp_trigger
    AFTER INSERT ON post_likes
    FOR EACH ROW
    EXECUTE FUNCTION handle_post_interaction();

-- Update create_post function to remove direct XP award
CREATE OR REPLACE FUNCTION create_post(
    p_food_id UUID,
    p_caption TEXT DEFAULT NULL,
    p_is_explore BOOLEAN DEFAULT false
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
) AS $$
DECLARE
    v_user_id UUID;
    v_post_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Insert the post (this will trigger the XP award via posts_xp_trigger)
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
        COALESCE((SELECT COUNT(*)::BIGINT FROM post_likes pl WHERE pl.post_id = p.id), 0) AS likes_count,
        COALESCE((SELECT COUNT(*)::BIGINT FROM post_reposts pr WHERE pr.post_id = p.id), 0) AS reposts_count,
        EXISTS (SELECT 1 FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = v_user_id) AS is_liked,
        EXISTS (SELECT 1 FROM post_reposts pr WHERE pr.post_id = p.id AND pr.user_id = v_user_id) AS is_reposted
    FROM posts p
    JOIN favorite_foods f ON p.food_id = f.id
    JOIN user_profiles up ON p.user_id = up.id
    WHERE p.id = v_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update toggle_post_like function to remove direct XP award
CREATE OR REPLACE FUNCTION toggle_post_like(p_post_id UUID)
RETURNS TABLE (is_liked BOOLEAN, likes_count BIGINT)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_user_id UUID;
    v_is_liked BOOLEAN;
    v_likes_count BIGINT;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Check if user has already liked the post
    IF EXISTS (
        SELECT 1 FROM post_likes
        WHERE post_id = p_post_id AND user_id = v_user_id
    ) THEN
        -- Unlike
        DELETE FROM post_likes
        WHERE post_id = p_post_id AND user_id = v_user_id;
        v_is_liked := false;
    ELSE
        -- Like (this will trigger the XP award via post_likes_xp_trigger)
        INSERT INTO post_likes (post_id, user_id)
        VALUES (p_post_id, v_user_id);
        v_is_liked := true;
    END IF;

    -- Get updated likes count
    SELECT COUNT(*)::BIGINT INTO v_likes_count
    FROM post_likes
    WHERE post_id = p_post_id;

    RETURN QUERY
    SELECT v_is_liked, v_likes_count;
END;
$$; 