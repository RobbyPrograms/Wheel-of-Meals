-- Function to get most liked foods in a given time period
CREATE OR REPLACE FUNCTION get_most_liked_foods(time_period interval, limit_count integer)
RETURNS TABLE (
  id uuid,
  name text,
  likes_count bigint,
  meal_types text[],
  username text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.name,
    COUNT(fl.food_id) as likes_count,
    f.meal_types,
    up.username
  FROM favorite_foods f
  LEFT JOIN food_likes fl ON f.id = fl.food_id
  JOIN user_profiles up ON f.user_id = up.id
  WHERE fl.created_at >= NOW() - time_period
  GROUP BY f.id, f.name, f.meal_types, up.username
  ORDER BY likes_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get top rated foods
CREATE OR REPLACE FUNCTION get_top_rated_foods(limit_count integer)
RETURNS TABLE (
  id uuid,
  name text,
  likes_count bigint,
  meal_types text[],
  username text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.name,
    COUNT(fl.food_id) as likes_count,
    f.meal_types,
    up.username
  FROM favorite_foods f
  LEFT JOIN food_likes fl ON f.id = fl.food_id
  JOIN user_profiles up ON f.user_id = up.id
  WHERE f.rating >= 4
  GROUP BY f.id, f.name, f.meal_types, up.username
  ORDER BY f.rating DESC, likes_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get healthy foods (based on tags or ingredients)
CREATE OR REPLACE FUNCTION get_healthy_foods(limit_count integer)
RETURNS TABLE (
  id uuid,
  name text,
  likes_count bigint,
  meal_types text[],
  username text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.name,
    COUNT(fl.food_id) as likes_count,
    f.meal_types,
    up.username
  FROM favorite_foods f
  LEFT JOIN food_likes fl ON f.id = fl.food_id
  JOIN user_profiles up ON f.user_id = up.id
  WHERE 
    -- Check for healthy indicators in meal types or ingredients
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
  GROUP BY f.id, f.name, f.meal_types, up.username
  ORDER BY likes_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 