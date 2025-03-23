-- Drop the existing function
DROP FUNCTION IF EXISTS get_explore_posts();

-- Enhanced get posts function that includes meal and user details
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
  avatar_url TEXT
) AS $$
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
    u.username,
    u.display_name,
    u.avatar_url
  FROM posts p
  JOIN favorite_foods f ON p.food_id = f.id
  JOIN user_profiles u ON p.user_id = u.id
  ORDER BY p.created_at DESC;
$$ LANGUAGE sql SECURITY DEFINER; 