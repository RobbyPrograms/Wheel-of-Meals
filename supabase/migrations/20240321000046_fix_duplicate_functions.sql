-- Drop all versions of the functions
DROP FUNCTION IF EXISTS get_friends_posts();
DROP FUNCTION IF EXISTS get_friends_posts(OUT id uuid, OUT user_id uuid, OUT food_id uuid, OUT caption text, OUT created_at timestamptz, OUT is_explore boolean, OUT food_name text, OUT food_ingredients text[], OUT food_recipe text, OUT food_meal_types text[], OUT food_visibility text, OUT username text, OUT display_name text, OUT avatar_url text, OUT likes_count bigint, OUT reposts_count bigint, OUT is_liked boolean, OUT is_reposted boolean, OUT reposted_by_username text, OUT reposted_by_display_name text, OUT repost_created_at timestamptz);

DROP FUNCTION IF EXISTS get_explore_posts();
DROP FUNCTION IF EXISTS get_explore_posts(OUT id uuid, OUT user_id uuid, OUT food_id uuid, OUT caption text, OUT created_at timestamptz, OUT is_explore boolean, OUT food_name text, OUT food_ingredients text[], OUT food_recipe text, OUT food_meal_types text[], OUT food_visibility text, OUT username text, OUT display_name text, OUT avatar_url text, OUT likes_count bigint, OUT reposts_count bigint, OUT is_liked boolean, OUT is_reposted boolean, OUT reposted_by_username text, OUT reposted_by_display_name text, OUT repost_created_at timestamptz);

DROP FUNCTION IF EXISTS get_user_posts();
DROP FUNCTION IF EXISTS get_user_posts(OUT id uuid, OUT user_id uuid, OUT food_id uuid, OUT caption text, OUT created_at timestamptz, OUT is_explore boolean, OUT food_name text, OUT food_ingredients text[], OUT food_recipe text, OUT food_meal_types text[], OUT food_visibility text, OUT username text, OUT display_name text, OUT avatar_url text, OUT likes_count bigint, OUT reposts_count bigint, OUT is_liked boolean, OUT is_reposted boolean, OUT reposted_by_username text, OUT reposted_by_display_name text, OUT repost_created_at timestamptz);

DROP FUNCTION IF EXISTS create_post(p_food_id uuid, p_caption text, p_is_explore boolean);
DROP FUNCTION IF EXISTS create_post(p_food_id uuid, p_caption text);

-- Now recreate the functions with their latest versions
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
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM favorite_foods ff
        WHERE ff.id = p_food_id AND ff.user_id = v_user_id
    ) THEN
        RAISE EXCEPTION 'Food item not found or does not belong to user';
    END IF;

    INSERT INTO posts (user_id, food_id, caption, is_explore)
    VALUES (v_user_id, p_food_id, p_caption, p_is_explore)
    RETURNING posts.id INTO v_post_id;

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
    JOIN user_profiles up ON p.user_id = up.id
    WHERE p.id = v_post_id;
END;
$$;

CREATE OR REPLACE FUNCTION get_explore_posts()
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
    WITH post_data AS (
        -- Original posts
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
            NULL::TIMESTAMPTZ AS repost_created_at,
            likes.count AS likes_count,
            reposts.count AS reposts_count,
            likes.is_liked,
            reposts.is_reposted
        FROM posts p
        JOIN favorite_foods ff ON p.food_id = ff.id
        JOIN user_profiles up ON p.user_id = up.id
        CROSS JOIN LATERAL (
            SELECT 
                COUNT(pl.*)::BIGINT AS count,
                bool_or(pl.user_id = v_user_id) AS is_liked
            FROM post_likes pl
            WHERE pl.post_id = p.id
        ) likes
        CROSS JOIN LATERAL (
            SELECT 
                COUNT(pr.*)::BIGINT AS count,
                bool_or(pr.user_id = v_user_id) AS is_reposted
            FROM post_reposts pr
            WHERE pr.post_id = p.id
        ) reposts
        WHERE p.is_explore = true

        UNION ALL

        -- Reposted posts
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
            reposter.username AS reposted_by_username,
            reposter.display_name AS reposted_by_display_name,
            pr.created_at AS repost_created_at,
            likes.count AS likes_count,
            reposts.count AS reposts_count,
            likes.is_liked,
            reposts.is_reposted
        FROM posts p
        JOIN favorite_foods ff ON p.food_id = ff.id
        JOIN user_profiles up ON p.user_id = up.id
        JOIN post_reposts pr ON pr.post_id = p.id
        JOIN user_profiles reposter ON pr.user_id = reposter.id
        CROSS JOIN LATERAL (
            SELECT 
                COUNT(pl.*)::BIGINT AS count,
                bool_or(pl.user_id = v_user_id) AS is_liked
            FROM post_likes pl
            WHERE pl.post_id = p.id
        ) likes
        CROSS JOIN LATERAL (
            SELECT 
                COUNT(pr2.*)::BIGINT AS count,
                bool_or(pr2.user_id = v_user_id) AS is_reposted
            FROM post_reposts pr2
            WHERE pr2.post_id = p.id
        ) reposts
        WHERE p.is_explore = true
    )
    SELECT 
        pd.id,
        pd.user_id,
        pd.food_id,
        pd.caption,
        pd.created_at,
        pd.is_explore,
        pd.food_name,
        pd.food_ingredients,
        pd.food_recipe,
        pd.food_meal_types,
        pd.food_visibility,
        pd.username,
        pd.display_name,
        pd.avatar_url,
        pd.likes_count,
        pd.reposts_count,
        pd.is_liked,
        pd.is_reposted,
        pd.reposted_by_username,
        pd.reposted_by_display_name,
        pd.repost_created_at
    FROM post_data pd
    ORDER BY 
        COALESCE(pd.repost_created_at, pd.created_at) DESC;
END;
$$;

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
    WITH post_data AS (
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
            NULL::TIMESTAMPTZ AS repost_created_at,
            COUNT(pl.*)::BIGINT AS likes_count,
            COUNT(pr.*)::BIGINT AS reposts_count,
            bool_or(pl.user_id = v_user_id) AS is_liked,
            bool_or(pr.user_id = v_user_id) AS is_reposted
        FROM posts p
        JOIN favorite_foods ff ON p.food_id = ff.id
        JOIN user_profiles up ON p.user_id = up.id
        LEFT JOIN post_likes pl ON pl.post_id = p.id
        LEFT JOIN post_reposts pr ON pr.post_id = p.id
        WHERE EXISTS (
            SELECT 1 FROM friendships f
            WHERE (f.user_id_1 = v_user_id AND f.user_id_2 = p.user_id OR 
                  f.user_id_2 = v_user_id AND f.user_id_1 = p.user_id)
            AND f.status = 'accepted'
        )
        GROUP BY p.id, p.user_id, p.food_id, p.caption, p.created_at, p.is_explore,
                 ff.name, ff.ingredients, ff.recipe, ff.meal_types, ff.visibility,
                 up.username, up.display_name, up.avatar_url

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
            reposter.username AS reposted_by_username,
            reposter.display_name AS reposted_by_display_name,
            pr.created_at AS repost_created_at,
            COUNT(pl.*)::BIGINT AS likes_count,
            COUNT(pr2.*)::BIGINT AS reposts_count,
            bool_or(pl.user_id = v_user_id) AS is_liked,
            bool_or(pr2.user_id = v_user_id) AS is_reposted
        FROM posts p
        JOIN favorite_foods ff ON p.food_id = ff.id
        JOIN user_profiles up ON p.user_id = up.id
        JOIN post_reposts pr ON pr.post_id = p.id
        JOIN user_profiles reposter ON pr.user_id = reposter.id
        LEFT JOIN post_likes pl ON pl.post_id = p.id
        LEFT JOIN post_reposts pr2 ON pr2.post_id = p.id
        WHERE EXISTS (
            SELECT 1 FROM friendships f
            WHERE (f.user_id_1 = v_user_id AND f.user_id_2 = pr.user_id OR 
                  f.user_id_2 = v_user_id AND f.user_id_1 = pr.user_id)
            AND f.status = 'accepted'
        )
        GROUP BY p.id, p.user_id, p.food_id, p.caption, p.created_at, p.is_explore,
                 ff.name, ff.ingredients, ff.recipe, ff.meal_types, ff.visibility,
                 up.username, up.display_name, up.avatar_url,
                 reposter.username, reposter.display_name, pr.created_at
    )
    SELECT 
        pd.id,
        pd.user_id,
        pd.food_id,
        pd.caption,
        pd.created_at,
        pd.is_explore,
        pd.food_name,
        pd.food_ingredients,
        pd.food_recipe,
        pd.food_meal_types,
        pd.food_visibility,
        pd.username,
        pd.display_name,
        pd.avatar_url,
        pd.likes_count,
        pd.reposts_count,
        pd.is_liked,
        pd.is_reposted,
        pd.reposted_by_username,
        pd.reposted_by_display_name,
        pd.repost_created_at
    FROM post_data pd
    ORDER BY COALESCE(pd.repost_created_at, pd.created_at) DESC;
END;
$$;

CREATE OR REPLACE FUNCTION get_user_posts(p_user_id UUID)
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
    WITH post_data AS (
        -- Original posts
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
            NULL::TIMESTAMPTZ AS repost_created_at,
            likes.count AS likes_count,
            reposts.count AS reposts_count,
            likes.is_liked,
            reposts.is_reposted
        FROM posts p
        JOIN favorite_foods ff ON p.food_id = ff.id
        JOIN user_profiles up ON p.user_id = up.id
        CROSS JOIN LATERAL (
            SELECT 
                COUNT(pl.*)::BIGINT AS count,
                bool_or(pl.user_id = v_user_id) AS is_liked
            FROM post_likes pl
            WHERE pl.post_id = p.id
        ) likes
        CROSS JOIN LATERAL (
            SELECT 
                COUNT(pr.*)::BIGINT AS count,
                bool_or(pr.user_id = v_user_id) AS is_reposted
            FROM post_reposts pr
            WHERE pr.post_id = p.id
        ) reposts
        WHERE p.user_id = p_user_id

        UNION ALL

        -- Reposted posts
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
            pr.created_at AS repost_created_at,
            likes.count AS likes_count,
            reposts.count AS reposts_count,
            likes.is_liked,
            reposts.is_reposted
        FROM posts p
        JOIN favorite_foods ff ON p.food_id = ff.id
        JOIN user_profiles up ON p.user_id = up.id
        JOIN post_reposts pr ON p.id = pr.post_id
        JOIN user_profiles rup ON pr.user_id = rup.id
        CROSS JOIN LATERAL (
            SELECT 
                COUNT(pl.*)::BIGINT AS count,
                bool_or(pl.user_id = v_user_id) AS is_liked
            FROM post_likes pl
            WHERE pl.post_id = p.id
        ) likes
        CROSS JOIN LATERAL (
            SELECT 
                COUNT(pr2.*)::BIGINT AS count,
                bool_or(pr2.user_id = v_user_id) AS is_reposted
            FROM post_reposts pr2
            WHERE pr2.post_id = p.id
        ) reposts
        WHERE pr.user_id = p_user_id
    )
    SELECT 
        pd.id,
        pd.user_id,
        pd.food_id,
        pd.caption,
        pd.created_at,
        pd.is_explore,
        pd.food_name,
        pd.food_ingredients,
        pd.food_recipe,
        pd.food_meal_types,
        pd.food_visibility,
        pd.username,
        pd.display_name,
        pd.avatar_url,
        pd.likes_count,
        pd.reposts_count,
        pd.is_liked,
        pd.is_reposted,
        pd.reposted_by_username,
        pd.reposted_by_display_name,
        pd.repost_created_at
    FROM post_data pd
    ORDER BY 
        COALESCE(pd.repost_created_at, pd.created_at) DESC;
END;
$$;

CREATE OR REPLACE FUNCTION get_trending_posts()
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
    repost_created_at TIMESTAMPTZ,
    trending_score FLOAT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    RETURN QUERY
    WITH post_data AS (
        -- Original posts
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
            NULL::TIMESTAMPTZ AS repost_created_at,
            COUNT(pl.*)::BIGINT AS likes_count,
            COUNT(pr.*)::BIGINT AS reposts_count,
            bool_or(pl.user_id = v_user_id) AS is_liked,
            bool_or(pr.user_id = v_user_id) AS is_reposted,
            -- Trending score: (likes * 1.0 + reposts * 1.5) / hours_since_post^1.8
            (COUNT(pl.*)::FLOAT * 1.0 + COUNT(pr.*)::FLOAT * 1.5) / 
            POWER(EXTRACT(EPOCH FROM (NOW() - p.created_at))/3600 + 1, 1.8) AS trending_score
        FROM posts p
        JOIN favorite_foods ff ON p.food_id = ff.id
        JOIN user_profiles up ON p.user_id = up.id
        LEFT JOIN post_likes pl ON pl.post_id = p.id
        LEFT JOIN post_reposts pr ON pr.post_id = p.id
        WHERE p.created_at >= NOW() - INTERVAL '24 hours'
        AND ff.visibility = 'public'
        GROUP BY p.id, p.user_id, p.food_id, p.caption, p.created_at, p.is_explore,
                 ff.name, ff.ingredients, ff.recipe, ff.meal_types, ff.visibility,
                 up.username, up.display_name, up.avatar_url

        UNION ALL

        -- Reposts
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
            reposter.username AS reposted_by_username,
            reposter.display_name AS reposted_by_display_name,
            pr.created_at AS repost_created_at,
            COUNT(pl.*)::BIGINT AS likes_count,
            COUNT(pr2.*)::BIGINT AS reposts_count,
            bool_or(pl.user_id = v_user_id) AS is_liked,
            bool_or(pr2.user_id = v_user_id) AS is_reposted,
            -- Use repost time for trending score calculation
            (COUNT(pl.*)::FLOAT * 1.0 + COUNT(pr2.*)::FLOAT * 1.5) / 
            POWER(EXTRACT(EPOCH FROM (NOW() - pr.created_at))/3600 + 1, 1.8) AS trending_score
        FROM posts p
        JOIN favorite_foods ff ON p.food_id = ff.id
        JOIN user_profiles up ON p.user_id = up.id
        JOIN post_reposts pr ON pr.post_id = p.id
        JOIN user_profiles reposter ON pr.user_id = reposter.id
        LEFT JOIN post_likes pl ON pl.post_id = p.id
        LEFT JOIN post_reposts pr2 ON pr2.post_id = p.id
        WHERE pr.created_at >= NOW() - INTERVAL '24 hours'
        AND ff.visibility = 'public'
        GROUP BY p.id, p.user_id, p.food_id, p.caption, p.created_at, p.is_explore,
                 ff.name, ff.ingredients, ff.recipe, ff.meal_types, ff.visibility,
                 up.username, up.display_name, up.avatar_url,
                 reposter.username, reposter.display_name, pr.created_at
    )
    SELECT 
        pd.id,
        pd.user_id,
        pd.food_id,
        pd.caption,
        pd.created_at,
        pd.is_explore,
        pd.food_name,
        pd.food_ingredients,
        pd.food_recipe,
        pd.food_meal_types,
        pd.food_visibility,
        pd.username,
        pd.display_name,
        pd.avatar_url,
        pd.likes_count,
        pd.reposts_count,
        pd.is_liked,
        pd.is_reposted,
        pd.reposted_by_username,
        pd.reposted_by_display_name,
        pd.repost_created_at,
        pd.trending_score
    FROM post_data pd
    WHERE pd.trending_score > 0
    ORDER BY pd.trending_score DESC
    LIMIT 50;
END;
$$; 