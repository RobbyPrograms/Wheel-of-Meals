-- Create food_visibility_type enum
DO $$ BEGIN
    CREATE TYPE food_visibility_type AS ENUM ('public', 'private', 'friends');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Drop existing functions
DROP FUNCTION IF EXISTS create_post;
DROP FUNCTION IF EXISTS delete_post;
DROP FUNCTION IF EXISTS toggle_post_like;
DROP FUNCTION IF EXISTS toggle_post_repost;
DROP FUNCTION IF EXISTS get_trending_posts;

-- Create post function
CREATE OR REPLACE FUNCTION create_post(
  p_food_id UUID,
  p_caption TEXT DEFAULT NULL,
  p_is_explore BOOLEAN DEFAULT false,
  p_image_url TEXT DEFAULT NULL
) RETURNS TABLE (
  id UUID,
  user_id UUID,
  food_id UUID,
  caption TEXT,
  created_at TIMESTAMPTZ,
  is_explore BOOLEAN,
  image_url TEXT,
  food_name TEXT,
  food_image_url TEXT,
  food_visibility food_visibility_type,
  username TEXT,
  avatar_url TEXT,
  like_count BIGINT,
  comment_count BIGINT,
  reshare_count BIGINT,
  has_liked BOOLEAN,
  has_reshared BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH new_post AS (
    INSERT INTO posts (user_id, food_id, caption, is_explore, image_url)
    VALUES (auth.uid(), p_food_id, p_caption, p_is_explore, p_image_url)
    RETURNING *
  ),
  post_stats AS (
    SELECT 
      p.id,
      COUNT(DISTINCT pl.id) as like_count,
      COUNT(DISTINCT pc.id) as comment_count,
      COUNT(DISTINCT pr.id) as reshare_count,
      bool_or(CASE WHEN pl.user_id = auth.uid() THEN true ELSE false END) as has_liked,
      bool_or(CASE WHEN pr.user_id = auth.uid() THEN true ELSE false END) as has_reshared
    FROM new_post p
    LEFT JOIN post_likes pl ON p.id = pl.post_id
    LEFT JOIN post_comments pc ON p.id = pc.post_id
    LEFT JOIN post_reshares pr ON p.id = pr.post_id
    GROUP BY p.id
  )
  SELECT 
    p.id,
    p.user_id,
    p.food_id,
    p.caption,
    p.created_at,
    p.is_explore,
    p.image_url,
    f.name as food_name,
    f.image_url as food_image_url,
    f.visibility as food_visibility,
    u.username,
    u.avatar_url,
    COALESCE(ps.like_count, 0) as like_count,
    COALESCE(ps.comment_count, 0) as comment_count,
    COALESCE(ps.reshare_count, 0) as reshare_count,
    COALESCE(ps.has_liked, false) as has_liked,
    COALESCE(ps.has_reshared, false) as has_reshared
  FROM new_post p
  JOIN favorite_foods f ON p.food_id = f.id
  JOIN auth.users u ON p.user_id = u.id
  LEFT JOIN post_stats ps ON p.id = ps.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- Create trending posts function
CREATE OR REPLACE FUNCTION get_trending_posts()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  food_id UUID,
  caption TEXT,
  created_at TIMESTAMPTZ,
  is_explore BOOLEAN,
  image_url TEXT,
  food_name TEXT,
  food_image_url TEXT,
  food_visibility food_visibility_type,
  username TEXT,
  avatar_url TEXT,
  like_count BIGINT,
  comment_count BIGINT,
  reshare_count BIGINT,
  has_liked BOOLEAN,
  has_reshared BOOLEAN,
  engagement_score BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH post_stats AS (
    SELECT 
      p.id,
      COUNT(DISTINCT pl.id) as like_count,
      COUNT(DISTINCT pc.id) as comment_count,
      COUNT(DISTINCT pr.id) as reshare_count,
      bool_or(CASE WHEN pl.user_id = auth.uid() THEN true ELSE false END) as has_liked,
      bool_or(CASE WHEN pr.user_id = auth.uid() THEN true ELSE false END) as has_reshared,
      COUNT(DISTINCT pl.id) * 3 + COUNT(DISTINCT pc.id) * 2 + COUNT(DISTINCT pr.id) * 1 as engagement_score
    FROM posts p
    LEFT JOIN post_likes pl ON p.id = pl.post_id
    LEFT JOIN post_comments pc ON p.id = pc.post_id
    LEFT JOIN post_reshares pr ON p.id = pr.post_id
    WHERE p.created_at >= NOW() - INTERVAL '7 days'
    GROUP BY p.id
  )
  SELECT 
    p.id,
    p.user_id,
    p.food_id,
    p.caption,
    p.created_at,
    p.is_explore,
    p.image_url,
    f.name as food_name,
    f.image_url as food_image_url,
    f.visibility as food_visibility,
    u.username,
    u.avatar_url,
    COALESCE(ps.like_count, 0) as like_count,
    COALESCE(ps.comment_count, 0) as comment_count,
    COALESCE(ps.reshare_count, 0) as reshare_count,
    COALESCE(ps.has_liked, false) as has_liked,
    COALESCE(ps.has_reshared, false) as has_reshared,
    COALESCE(ps.engagement_score, 0) as engagement_score
  FROM posts p
  JOIN favorite_foods f ON p.food_id = f.id
  JOIN auth.users u ON p.user_id = u.id
  LEFT JOIN post_stats ps ON p.id = ps.id
  WHERE ps.engagement_score > 0
  ORDER BY ps.engagement_score DESC, p.created_at DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 