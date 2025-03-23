-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_id UUID NOT NULL REFERENCES favorite_foods(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  caption TEXT,
  UNIQUE(user_id, food_id) -- Prevent duplicate posts of the same food
);

-- Add RLS policies for posts
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view public posts"
  ON posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM favorite_foods f
      WHERE f.id = food_id
      AND (
        f.visibility = 'public'
        OR f.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create their own posts"
  ON posts FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own posts"
  ON posts FOR DELETE
  USING (user_id = auth.uid());

-- Function to create a new post
CREATE OR REPLACE FUNCTION create_post(
  p_food_id UUID,
  p_caption TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  food_id UUID,
  created_at TIMESTAMPTZ,
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
  -- Insert the new post
  INSERT INTO posts (user_id, food_id, caption)
  VALUES (auth.uid(), p_food_id, p_caption)
  RETURNING id INTO v_post_id;

  -- Return the newly created post with all related information
  RETURN QUERY
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
      WHERE fl.food_id = f.id AND fl.user_id = auth.uid()
    ) as is_liked,
    EXISTS (
      SELECT 1
      FROM saved_foods sf
      WHERE sf.food_id = f.id AND sf.user_id = auth.uid()
    ) as is_saved,
    COALESCE((
      SELECT COUNT(*)
      FROM food_reshares fr
      WHERE fr.food_id = f.id
    ), 0) as reshare_count
  FROM posts p
  JOIN favorite_foods f ON p.food_id = f.id
  JOIN user_profiles up ON p.user_id = up.id
  WHERE p.id = v_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 