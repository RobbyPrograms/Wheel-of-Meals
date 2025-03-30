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
      (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id) AS likes_count,
      (SELECT COUNT(*) FROM post_reposts pr WHERE pr.post_id = p.id) AS reposts_count,
      EXISTS (SELECT 1 FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = v_user_id) AS is_liked,
      EXISTS (SELECT 1 FROM post_reposts pr WHERE pr.post_id = p.id AND pr.user_id = v_user_id) AS is_reposted,
      NULL::text AS reposted_by_username,
      NULL::text AS reposted_by_display_name,
      NULL::timestamptz AS repost_created_at
    FROM posts p
    JOIN favorite_foods f ON p.food_id = f.id
    JOIN user_profiles up ON p.user_id = up.id
    WHERE p.is_explore = true

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
      (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id) AS likes_count,
      (SELECT COUNT(*) FROM post_reposts pr WHERE pr.post_id = p.id) AS reposts_count,
      EXISTS (SELECT 1 FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = v_user_id) AS is_liked,
      EXISTS (SELECT 1 FROM post_reposts pr WHERE pr.post_id = p.id AND pr.user_id = v_user_id) AS is_reposted,
      rup.username AS reposted_by_username,
      rup.display_name AS reposted_by_display_name,
      rp.created_at AS repost_created_at
    FROM posts p
    JOIN post_reposts rp ON p.id = rp.post_id
    JOIN favorite_foods f ON p.food_id = f.id
    JOIN user_profiles up ON p.user_id = up.id
    JOIN user_profiles rup ON rp.user_id = rup.id
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
    pd.likes_count + pd.reposts_count DESC,  -- Order by total engagement
    GREATEST(pd.created_at, pd.repost_created_at) DESC  -- Then by most recent activity
  LIMIT 50;
END;
$$; 