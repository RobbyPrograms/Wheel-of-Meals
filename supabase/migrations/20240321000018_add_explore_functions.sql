-- Function to get explore posts (public posts from all users)
CREATE OR REPLACE FUNCTION get_explore_posts(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  food_id UUID,
  created_at TIMESTAMPTZ,
  caption TEXT,
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
    COALESCE((
      SELECT COUNT(*)
      FROM food_likes fl
      WHERE fl.food_id = f.id
    ), 0) as likes_count,
    COALESCE((
      SELECT COUNT(*)
      FROM food_comments fc
      WHERE fc.food_id = f.id
    ), 0) as comments_count,
    EXISTS (
      SELECT 1
      FROM food_likes fl
      WHERE fl.food_id = f.id AND fl.user_id = p_user_id
    ) as is_liked,
    EXISTS (
      SELECT 1
      FROM saved_foods sf
      WHERE sf.food_id = f.id AND sf.user_id = p_user_id
    ) as is_saved,
    COALESCE((
      SELECT COUNT(*)
      FROM food_reshares fr
      WHERE fr.food_id = f.id
    ), 0) as reshare_count
  FROM posts p
  JOIN favorite_foods f ON p.food_id = f.id
  JOIN user_profiles up ON p.user_id = up.id
  WHERE f.visibility = 'public'
  ORDER BY p.created_at DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get most liked foods
CREATE OR REPLACE FUNCTION get_most_liked_foods(time_period INTERVAL, limit_count INTEGER)
RETURNS TABLE (
  id UUID,
  name TEXT,
  likes_count BIGINT,
  meal_types TEXT[],
  username TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.name,
    COUNT(fl.food_id)::BIGINT as likes_count,
    f.meal_types,
    up.username
  FROM favorite_foods f
  JOIN food_likes fl ON f.id = fl.food_id
  JOIN user_profiles up ON f.user_id = up.id
  WHERE 
    f.visibility = 'public'
    AND fl.created_at >= NOW() - time_period
  GROUP BY f.id, f.name, f.meal_types, up.username
  ORDER BY likes_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get top rated foods
CREATE OR REPLACE FUNCTION get_top_rated_foods(limit_count INTEGER)
RETURNS TABLE (
  id UUID,
  name TEXT,
  likes_count BIGINT,
  meal_types TEXT[],
  username TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.name,
    COUNT(fl.food_id)::BIGINT as likes_count,
    f.meal_types,
    up.username
  FROM favorite_foods f
  LEFT JOIN food_likes fl ON f.id = fl.food_id
  JOIN user_profiles up ON f.user_id = up.id
  WHERE 
    f.visibility = 'public'
    AND f.rating >= 4
  GROUP BY f.id, f.name, f.meal_types, up.username
  ORDER BY f.rating DESC, likes_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get healthy foods
CREATE OR REPLACE FUNCTION get_healthy_foods(limit_count INTEGER)
RETURNS TABLE (
  id UUID,
  name TEXT,
  likes_count BIGINT,
  meal_types TEXT[],
  username TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.name,
    COUNT(fl.food_id)::BIGINT as likes_count,
    f.meal_types,
    up.username
  FROM favorite_foods f
  LEFT JOIN food_likes fl ON f.id = fl.food_id
  JOIN user_profiles up ON f.user_id = up.id
  WHERE 
    f.visibility = 'public'
    AND (
      EXISTS (
        SELECT 1
        FROM unnest(f.meal_types) mt
        WHERE LOWER(mt) IN ('healthy', 'vegan', 'vegetarian', 'salad')
      )
      OR EXISTS (
        SELECT 1
        FROM unnest(f.ingredients) ing
        WHERE LOWER(ing) SIMILAR TO '%(vegetable|fruit|grain|legume|bean|seed|nut)%'
      )
    )
  GROUP BY f.id, f.name, f.meal_types, up.username
  ORDER BY likes_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 