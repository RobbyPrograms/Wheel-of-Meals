-- Function to get user's posts
CREATE OR REPLACE FUNCTION get_user_posts()
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
  WHERE p.user_id = auth.uid()
  ORDER BY p.created_at DESC;
$$ LANGUAGE sql SECURITY DEFINER;

-- Function to delete a post
CREATE OR REPLACE FUNCTION delete_post(p_post_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get the user_id of the post
  SELECT user_id INTO v_user_id
  FROM posts
  WHERE id = p_post_id;

  -- Check if post exists and belongs to the current user
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Post not found';
  END IF;

  IF v_user_id != auth.uid() THEN
    RAISE EXCEPTION 'You can only delete your own posts';
  END IF;

  -- Delete the post
  DELETE FROM posts WHERE id = p_post_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 