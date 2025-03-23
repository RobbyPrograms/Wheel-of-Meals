-- Drop existing functions first
DROP FUNCTION IF EXISTS get_explore_posts();
DROP FUNCTION IF EXISTS get_user_posts();
DROP FUNCTION IF EXISTS get_post_details(UUID);
DROP FUNCTION IF EXISTS get_post_with_social(UUID);

-- Create likes table if it doesn't exist
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Create reposts table if it doesn't exist
CREATE TABLE IF NOT EXISTS post_reposts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can create their own likes" ON post_likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON post_likes;
DROP POLICY IF EXISTS "Users can view all likes" ON post_likes;
DROP POLICY IF EXISTS "Users can create their own reposts" ON post_reposts;
DROP POLICY IF EXISTS "Users can delete their own reposts" ON post_reposts;
DROP POLICY IF EXISTS "Users can view all reposts" ON post_reposts;

-- Enable RLS
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reposts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can create their own likes"
  ON post_likes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
  ON post_likes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view all likes"
  ON post_likes FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can create their own reposts"
  ON post_reposts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reposts"
  ON post_reposts FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view all reposts"
  ON post_reposts FOR SELECT TO authenticated
  USING (true);

-- Function to toggle like
CREATE OR REPLACE FUNCTION toggle_post_like(p_post_id UUID)
RETURNS TABLE (
  success BOOLEAN,
  is_liked BOOLEAN,
  likes_count BIGINT
) AS $$
DECLARE
  v_is_liked BOOLEAN;
  v_likes_count BIGINT;
BEGIN
  -- Check if user has already liked the post
  SELECT EXISTS (
    SELECT 1 FROM post_likes
    WHERE post_id = p_post_id AND user_id = auth.uid()
  ) INTO v_is_liked;

  IF v_is_liked THEN
    -- Unlike
    DELETE FROM post_likes
    WHERE post_id = p_post_id AND user_id = auth.uid();
    v_is_liked := false;
  ELSE
    -- Like
    INSERT INTO post_likes (post_id, user_id)
    VALUES (p_post_id, auth.uid());
    v_is_liked := true;
  END IF;

  -- Get updated likes count
  SELECT COUNT(*) INTO v_likes_count
  FROM post_likes
  WHERE post_id = p_post_id;

  RETURN QUERY
  SELECT true, v_is_liked, v_likes_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to toggle repost
CREATE OR REPLACE FUNCTION toggle_post_repost(p_post_id UUID)
RETURNS TABLE (
  success BOOLEAN,
  is_reposted BOOLEAN,
  reposts_count BIGINT
) AS $$
DECLARE
  v_is_reposted BOOLEAN;
  v_reposts_count BIGINT;
BEGIN
  -- Check if user has already reposted
  SELECT EXISTS (
    SELECT 1 FROM post_reposts
    WHERE post_id = p_post_id AND user_id = auth.uid()
  ) INTO v_is_reposted;

  IF v_is_reposted THEN
    -- Remove repost
    DELETE FROM post_reposts
    WHERE post_id = p_post_id AND user_id = auth.uid();
    v_is_reposted := false;
  ELSE
    -- Add repost
    INSERT INTO post_reposts (post_id, user_id)
    VALUES (p_post_id, auth.uid());
    v_is_reposted := true;
  END IF;

  -- Get updated reposts count
  SELECT COUNT(*) INTO v_reposts_count
  FROM post_reposts
  WHERE post_id = p_post_id;

  RETURN QUERY
  SELECT true, v_is_reposted, v_reposts_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update get_explore_posts and get_user_posts to include like and repost info
CREATE OR REPLACE FUNCTION get_post_with_social(p_post_id UUID)
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
  avatar_url TEXT,
  likes_count BIGINT,
  reposts_count BIGINT,
  is_liked BOOLEAN,
  is_reposted BOOLEAN
) AS $$
  SELECT 
    p.*,
    f.name AS food_name,
    f.ingredients AS food_ingredients,
    f.recipe AS food_recipe,
    f.meal_types AS food_meal_types,
    f.visibility AS food_visibility,
    u.username,
    u.display_name,
    u.avatar_url,
    COALESCE((SELECT COUNT(*) FROM post_likes WHERE post_id = p.id), 0) as likes_count,
    COALESCE((SELECT COUNT(*) FROM post_reposts WHERE post_id = p.id), 0) as reposts_count,
    EXISTS (SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = auth.uid()) as is_liked,
    EXISTS (SELECT 1 FROM post_reposts WHERE post_id = p.id AND user_id = auth.uid()) as is_reposted
  FROM posts p
  JOIN favorite_foods f ON p.food_id = f.id
  JOIN user_profiles u ON p.user_id = u.id
  WHERE p.id = p_post_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- Update get_explore_posts to include social info
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
  avatar_url TEXT,
  likes_count BIGINT,
  reposts_count BIGINT,
  is_liked BOOLEAN,
  is_reposted BOOLEAN
) AS $$
  SELECT 
    p.*,
    f.name AS food_name,
    f.ingredients AS food_ingredients,
    f.recipe AS food_recipe,
    f.meal_types AS food_meal_types,
    f.visibility AS food_visibility,
    u.username,
    u.display_name,
    u.avatar_url,
    COALESCE((SELECT COUNT(*) FROM post_likes WHERE post_id = p.id), 0) as likes_count,
    COALESCE((SELECT COUNT(*) FROM post_reposts WHERE post_id = p.id), 0) as reposts_count,
    EXISTS (SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = auth.uid()) as is_liked,
    EXISTS (SELECT 1 FROM post_reposts WHERE post_id = p.id AND user_id = auth.uid()) as is_reposted
  FROM posts p
  JOIN favorite_foods f ON p.food_id = f.id
  JOIN user_profiles u ON p.user_id = u.id
  ORDER BY p.created_at DESC;
$$ LANGUAGE sql SECURITY DEFINER;

-- Update get_user_posts to include social info
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
  avatar_url TEXT,
  likes_count BIGINT,
  reposts_count BIGINT,
  is_liked BOOLEAN,
  is_reposted BOOLEAN
) AS $$
  SELECT 
    p.*,
    f.name AS food_name,
    f.ingredients AS food_ingredients,
    f.recipe AS food_recipe,
    f.meal_types AS food_meal_types,
    f.visibility AS food_visibility,
    u.username,
    u.display_name,
    u.avatar_url,
    COALESCE((SELECT COUNT(*) FROM post_likes WHERE post_id = p.id), 0) as likes_count,
    COALESCE((SELECT COUNT(*) FROM post_reposts WHERE post_id = p.id), 0) as reposts_count,
    EXISTS (SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = auth.uid()) as is_liked,
    EXISTS (SELECT 1 FROM post_reposts WHERE post_id = p.id AND user_id = auth.uid()) as is_reposted
  FROM posts p
  JOIN favorite_foods f ON p.food_id = f.id
  JOIN user_profiles u ON p.user_id = u.id
  WHERE p.user_id = auth.uid()
  ORDER BY p.created_at DESC;
$$ LANGUAGE sql SECURITY DEFINER; 