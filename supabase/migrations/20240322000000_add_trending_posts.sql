-- Drop existing get_trending_posts function
DROP FUNCTION IF EXISTS get_trending_posts();
DROP FUNCTION IF EXISTS get_trending_posts(OUT id uuid, OUT user_id uuid, OUT food_id uuid, OUT caption text, OUT created_at timestamptz, OUT is_explore boolean, OUT food_name text, OUT food_ingredients text[], OUT food_recipe text, OUT food_meal_types text[], OUT food_visibility text, OUT username text, OUT display_name text, OUT avatar_url text, OUT likes_count bigint, OUT reposts_count bigint, OUT is_liked boolean, OUT is_reposted boolean, OUT reposted_by_username text, OUT reposted_by_display_name text, OUT repost_created_at timestamptz, OUT trending_score float);

-- Create get_trending_posts function
CREATE OR REPLACE FUNCTION public.get_trending_posts()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  food_id uuid,
  caption text,
  created_at timestamptz,
  is_explore boolean,
  food_name text,
  food_ingredients text[],
  food_recipe text,
  food_meal_types text[],
  food_visibility text,
  username text,
  display_name text,
  avatar_url text,
  likes_count bigint,
  reposts_count bigint,
  is_liked boolean,
  is_reposted boolean,
  reposted_by_username text,
  reposted_by_display_name text,
  repost_created_at timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  WITH post_data AS (
    -- Get original posts with their metrics
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
      -- Calculate trending score based on likes, reposts, and time decay
      (
        COALESCE(pl.likes_count, 0) * 1.0 + 
        COALESCE(pr.reposts_count, 0) * 1.5
      ) / POWER(EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600 + 2, 1.8) AS trending_score,
      COALESCE(pl.likes_count, 0) AS likes_count,
      COALESCE(pr.reposts_count, 0) AS reposts_count,
      EXISTS (SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = v_user_id) AS is_liked,
      EXISTS (SELECT 1 FROM post_reposts WHERE post_id = p.id AND user_id = v_user_id) AS is_reposted,
      NULL::text AS reposted_by_username,
      NULL::text AS reposted_by_display_name,
      NULL::timestamptz AS repost_created_at
    FROM posts p
    JOIN favorite_foods f ON p.food_id = f.id
    JOIN user_profiles up ON p.user_id = up.id
    LEFT JOIN LATERAL (
      SELECT COUNT(*) AS likes_count 
      FROM post_likes 
      WHERE post_id = p.id
    ) pl ON true
    LEFT JOIN LATERAL (
      SELECT COUNT(*) AS reposts_count 
      FROM post_reposts 
      WHERE post_id = p.id
    ) pr ON true
    WHERE p.created_at >= NOW() - INTERVAL '24 hours'
      AND p.is_explore = true
      AND f.visibility = 'public'

    UNION ALL

    -- Get reposts with their metrics
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
      -- Calculate trending score for reposts
      (
        COALESCE(pl.likes_count, 0) * 1.0 + 
        COALESCE(pr.reposts_count, 0) * 1.5
      ) / POWER(EXTRACT(EPOCH FROM (NOW() - rp.created_at)) / 3600 + 2, 1.8) AS trending_score,
      COALESCE(pl.likes_count, 0) AS likes_count,
      COALESCE(pr.reposts_count, 0) AS reposts_count,
      EXISTS (SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = v_user_id) AS is_liked,
      EXISTS (SELECT 1 FROM post_reposts WHERE post_id = p.id AND user_id = v_user_id) AS is_reposted,
      rup.username AS reposted_by_username,
      rup.display_name AS reposted_by_display_name,
      rp.created_at AS repost_created_at
    FROM posts p
    JOIN post_reposts rp ON p.id = rp.post_id
    JOIN favorite_foods f ON p.food_id = f.id
    JOIN user_profiles up ON p.user_id = up.id
    JOIN user_profiles rup ON rp.user_id = rup.id
    LEFT JOIN LATERAL (
      SELECT COUNT(*) AS likes_count 
      FROM post_likes 
      WHERE post_id = p.id
    ) pl ON true
    LEFT JOIN LATERAL (
      SELECT COUNT(*) AS reposts_count 
      FROM post_reposts 
      WHERE post_id = p.id
    ) pr ON true
    WHERE rp.created_at >= NOW() - INTERVAL '24 hours'
      AND p.is_explore = true
      AND f.visibility = 'public'
  )
  SELECT 
    id,
    user_id,
    food_id,
    caption,
    created_at,
    is_explore,
    food_name,
    food_ingredients,
    food_recipe,
    food_meal_types,
    food_visibility,
    username,
    display_name,
    avatar_url,
    likes_count,
    reposts_count,
    is_liked,
    is_reposted,
    reposted_by_username,
    reposted_by_display_name,
    repost_created_at
  FROM post_data
  ORDER BY trending_score DESC
  LIMIT 50;
END;
$$; 