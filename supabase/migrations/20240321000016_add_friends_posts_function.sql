-- Function to get posts from friends
CREATE OR REPLACE FUNCTION get_friends_posts(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  food_id uuid,
  created_at timestamptz,
  user_info jsonb,
  food jsonb,
  likes_count bigint,
  comments_count bigint,
  is_liked boolean,
  is_saved boolean,
  reshare_count bigint
) AS $$
BEGIN
  RETURN QUERY
  WITH friend_list AS (
    SELECT friend_id
    FROM friends
    WHERE user_id = p_user_id AND status = 'accepted'
  )
  SELECT 
    p.id,
    p.user_id,
    p.food_id,
    p.created_at,
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
  JOIN friend_list fl ON p.user_id = fl.friend_id
  JOIN favorite_foods f ON p.food_id = f.id
  JOIN user_profiles up ON p.user_id = up.id
  WHERE f.visibility = 'public'
  ORDER BY p.created_at DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 