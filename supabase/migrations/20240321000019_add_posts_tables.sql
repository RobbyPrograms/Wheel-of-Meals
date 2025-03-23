-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  food_id UUID REFERENCES favorite_foods(id) ON DELETE CASCADE NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, food_id)
);

-- Create post likes table
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(post_id, user_id)
);

-- Create post comments table
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create post reshares table
CREATE TABLE IF NOT EXISTS post_reshares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(post_id, user_id)
);

-- Add RLS policies
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reshares ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can create their own posts" ON posts;
DROP POLICY IF EXISTS "Users can view posts from public foods or their own posts" ON posts;
DROP POLICY IF EXISTS "Users can like/unlike posts they can view" ON post_likes;
DROP POLICY IF EXISTS "Users can comment on posts they can view" ON post_comments;
DROP POLICY IF EXISTS "Users can reshare posts they can view" ON post_reshares;

-- Posts policies
CREATE POLICY "Users can create their own posts"
  ON posts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view posts from public foods or their own posts"
  ON posts FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM favorite_foods f
      WHERE f.id = food_id
      AND (f.visibility = 'public' OR f.user_id = auth.uid())
    )
  );

-- Post likes policies
CREATE POLICY "Users can like/unlike posts they can view"
  ON post_likes FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM posts p
      JOIN favorite_foods f ON p.food_id = f.id
      WHERE p.id = post_id
      AND (f.visibility = 'public' OR f.user_id = auth.uid())
    )
  );

-- Post comments policies
CREATE POLICY "Users can comment on posts they can view"
  ON post_comments FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM posts p
      JOIN favorite_foods f ON p.food_id = f.id
      WHERE p.id = post_id
      AND (f.visibility = 'public' OR f.user_id = auth.uid())
    )
  );

-- Post reshares policies
CREATE POLICY "Users can reshare posts they can view"
  ON post_reshares FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM posts p
      JOIN favorite_foods f ON p.food_id = f.id
      WHERE p.id = post_id
      AND (f.visibility = 'public' OR f.user_id = auth.uid())
    )
  );

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS create_post(UUID, TEXT);

-- Create post function
CREATE OR REPLACE FUNCTION create_post(
  p_food_id UUID,
  p_caption TEXT DEFAULT NULL
) RETURNS TABLE (
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
DECLARE
  v_post_id UUID;
BEGIN
  -- Insert the post
  INSERT INTO posts (user_id, food_id, caption)
  VALUES (auth.uid(), p_food_id, p_caption)
  RETURNING id INTO v_post_id;

  -- Return the complete post data
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
    COALESCE((SELECT COUNT(*) FROM post_likes WHERE post_id = p.id), 0) as likes_count,
    COALESCE((SELECT COUNT(*) FROM post_comments WHERE post_id = p.id), 0) as comments_count,
    EXISTS (SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = auth.uid()) as is_liked,
    EXISTS (SELECT 1 FROM saved_foods WHERE food_id = f.id AND user_id = auth.uid()) as is_saved,
    COALESCE((SELECT COUNT(*) FROM post_reshares WHERE post_id = p.id), 0) as reshare_count
  FROM posts p
  JOIN favorite_foods f ON p.food_id = f.id
  JOIN user_profiles up ON p.user_id = up.id
  WHERE p.id = v_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 