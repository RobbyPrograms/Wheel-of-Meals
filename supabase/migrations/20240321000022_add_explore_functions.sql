-- Function to get explore posts
CREATE OR REPLACE FUNCTION get_explore_posts()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  food_id UUID,
  created_at TIMESTAMPTZ,
  caption TEXT,
  is_explore BOOLEAN,
  user_info JSONB,
  food JSONB,
  likes_count BIGINT,
  comments_count BIGINT,
  is_liked BOOLEAN,
  is_saved BOOLEAN,
  reshare_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.food_id,
    p.created_at,
    p.caption,
    p.is_explore,
    jsonb_build_object(
      'id', up.id,
      'username', up.username,
      'display_name', up.display_name,
      'avatar_url', up.avatar_url
    ) as user_info,
    jsonb_build_object(
      'id', f.id,
      'name', f.name,
      'description', f.description,
      'ingredients', f.ingredients,
      'recipe', f.recipe,
      'meal_types', f.meal_types,
      'rating', f.rating,
      'visibility', f.visibility
    ) as food,
    COALESCE((SELECT COUNT(*) FROM post_likes WHERE post_id = p.id), 0) as likes_count,
    COALESCE((SELECT COUNT(*) FROM post_comments WHERE post_id = p.id), 0) as comments_count,
    EXISTS (SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = auth.uid()) as is_liked,
    EXISTS (SELECT 1 FROM saved_foods WHERE food_id = p.food_id AND user_id = auth.uid()) as is_saved,
    COALESCE((SELECT COUNT(*) FROM post_reshares WHERE post_id = p.id), 0) as reshare_count
  FROM posts p
  JOIN favorite_foods f ON p.food_id = f.id
  JOIN user_profiles up ON p.user_id = up.id
  WHERE p.is_explore = true
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get most liked foods
CREATE OR REPLACE FUNCTION get_most_liked_foods(
  time_period TEXT,
  limit_count INTEGER DEFAULT 3
) RETURNS TABLE (
  id UUID,
  name TEXT,
  likes_count BIGINT,
  meal_types TEXT[],
  username TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH liked_foods AS (
    SELECT 
      f.id,
      f.name,
      f.meal_types,
      up.username,
      COUNT(pl.id) as likes_count
    FROM favorite_foods f
    JOIN posts p ON p.food_id = f.id
    JOIN user_profiles up ON f.user_id = up.id
    LEFT JOIN post_likes pl ON pl.post_id = p.id
    WHERE 
      CASE 
        WHEN time_period = '24 hours' THEN p.created_at >= NOW() - INTERVAL '24 hours'
        WHEN time_period = '7 days' THEN p.created_at >= NOW() - INTERVAL '7 days'
        WHEN time_period = '30 days' THEN p.created_at >= NOW() - INTERVAL '30 days'
        ELSE true
      END
    GROUP BY f.id, f.name, f.meal_types, up.username
  )
  SELECT *
  FROM liked_foods
  ORDER BY likes_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get top rated foods
CREATE OR REPLACE FUNCTION get_top_rated_foods(
  min_rating NUMERIC DEFAULT 4.0,
  limit_count INTEGER DEFAULT 3
) RETURNS TABLE (
  id UUID,
  name TEXT,
  rating NUMERIC,
  meal_types TEXT[],
  username TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.name,
    f.rating,
    f.meal_types,
    up.username
  FROM favorite_foods f
  JOIN user_profiles up ON f.user_id = up.id
  WHERE f.rating >= min_rating
  ORDER BY f.rating DESC, f.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get healthy foods
CREATE OR REPLACE FUNCTION get_healthy_foods(
  limit_count INTEGER DEFAULT 3
) RETURNS TABLE (
  id UUID,
  name TEXT,
  meal_types TEXT[],
  username TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.name,
    f.meal_types,
    up.username
  FROM favorite_foods f
  JOIN user_profiles up ON f.user_id = up.id
  WHERE 
    -- Add your criteria for healthy foods here
    -- This is a simple example - you might want to add more sophisticated criteria
    f.visibility = 'public'
    AND EXISTS (
      SELECT 1 FROM unnest(f.ingredients) ingredient
      WHERE ingredient ILIKE ANY(ARRAY['%vegetable%', '%fruit%', '%lean%', '%fish%', '%grain%'])
    )
  ORDER BY f.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 