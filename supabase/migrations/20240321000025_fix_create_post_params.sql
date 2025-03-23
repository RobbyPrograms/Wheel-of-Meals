-- Drop existing function
DROP FUNCTION IF EXISTS create_post(UUID, TEXT, BOOLEAN);

-- Create post function with correct parameter names
CREATE OR REPLACE FUNCTION create_post(
  p_food_id UUID,
  p_caption TEXT DEFAULT NULL,
  p_is_explore BOOLEAN DEFAULT false
) RETURNS TABLE (
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
DECLARE
  v_post_id UUID;
BEGIN
  -- Insert the post
  INSERT INTO posts (user_id, food_id, caption, is_explore)
  VALUES (auth.uid(), p_food_id, p_caption, p_is_explore)
  RETURNING id INTO v_post_id;

  -- Return the complete post data
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
      'ingredients', f.ingredients,
      'recipe', f.recipe,
      'meal_types', f.meal_types,
      'rating', f.rating,
      'visibility', f.visibility
    ) as food,
    0::BIGINT as likes_count,
    0::BIGINT as comments_count,
    false as is_liked,
    EXISTS (SELECT 1 FROM saved_foods WHERE food_id = p.food_id AND user_id = auth.uid()) as is_saved,
    0::BIGINT as reshare_count
  FROM posts p
  JOIN favorite_foods f ON p.food_id = f.id
  JOIN user_profiles up ON p.user_id = up.id
  WHERE p.id = v_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 