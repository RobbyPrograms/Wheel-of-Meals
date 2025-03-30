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
  repost_created_at timestamptz,
  trending_score float
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
  WITH post_metrics AS (
    -- Calculate metrics for all posts
    SELECT 
      p.id AS post_id,
      p.created_at,
      COUNT(pl.*) AS likes_count,
      COUNT(pr.*) AS reposts_count,
      EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600 AS hours_old
    FROM posts p
    LEFT JOIN post_likes pl ON p.id = pl.post_id
    LEFT JOIN post_reposts pr ON p.id = pr.post_id
    WHERE p.is_explore = true
    GROUP BY p.id, p.created_at
  ),
  post_data AS (
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
      pm.likes_count,
      pm.reposts_count,
      EXISTS (SELECT 1 FROM post_likes pl2 WHERE pl2.post_id = p.id AND pl2.user_id = v_user_id) AS is_liked,
      EXISTS (SELECT 1 FROM post_reposts pr2 WHERE pr2.post_id = p.id AND pr2.user_id = v_user_id) AS is_reposted,
      NULL::text AS reposted_by_username,
      NULL::text AS reposted_by_display_name,
      NULL::timestamptz AS repost_created_at,
      -- Calculate trending score with higher weight for recent activity
      (pm.likes_count + pm.reposts_count * 1.5) / (1 + pm.hours_old / 24)::float AS trending_score
    FROM posts p
    JOIN favorite_foods f ON p.food_id = f.id
    JOIN user_profiles up ON p.user_id = up.id
    JOIN post_metrics pm ON p.id = pm.post_id
    WHERE p.is_explore = true
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
      pm.likes_count,
      pm.reposts_count,
      EXISTS (SELECT 1 FROM post_likes pl2 WHERE pl2.post_id = p.id AND pl2.user_id = v_user_id) AS is_liked,
      EXISTS (SELECT 1 FROM post_reposts pr2 WHERE pr2.post_id = p.id AND pr2.user_id = v_user_id) AS is_reposted,
      rup.username AS reposted_by_username,
      rup.display_name AS reposted_by_display_name,
      rp.created_at AS repost_created_at,
      -- Calculate trending score based on most recent activity (repost time)
      (pm.likes_count + pm.reposts_count * 1.5) / (1 + EXTRACT(EPOCH FROM (NOW() - rp.created_at)) / 86400)::float AS trending_score
    FROM posts p
    JOIN post_reposts rp ON p.id = rp.post_id
    JOIN favorite_foods f ON p.food_id = f.id
    JOIN user_profiles up ON p.user_id = up.id
    JOIN user_profiles rup ON rp.user_id = rup.id
    JOIN post_metrics pm ON p.id = pm.post_id
    WHERE p.is_explore = true
      AND f.visibility = 'public'
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
  ORDER BY pd.trending_score DESC
  LIMIT 50;
END;
$$; 