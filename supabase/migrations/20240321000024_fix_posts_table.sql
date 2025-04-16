-- Drop existing tables and functions to ensure clean slate
DROP FUNCTION IF EXISTS create_post(UUID, TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS get_explore_posts();
DROP FUNCTION IF EXISTS get_trending_posts();
DROP FUNCTION IF EXISTS get_user_posts(UUID);

-- Create food_visibility_type enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE food_visibility_type AS ENUM ('public', 'private', 'friends');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add visibility column to favorite_foods if it doesn't exist
DO $$ BEGIN
    ALTER TABLE favorite_foods ADD COLUMN IF NOT EXISTS visibility food_visibility_type DEFAULT 'public';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Recreate posts table with correct structure
DROP TABLE IF EXISTS post_reshares;
DROP TABLE IF EXISTS post_comments;
DROP TABLE IF EXISTS post_likes;
DROP TABLE IF EXISTS posts;

CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  food_id UUID REFERENCES favorite_foods(id) ON DELETE CASCADE NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  is_explore BOOLEAN DEFAULT false NOT NULL,
  image_url TEXT
);

-- Recreate dependent tables
CREATE TABLE post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(post_id, user_id)
);

CREATE TABLE post_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE post_reshares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(post_id, user_id)
);

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reshares ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can create their own posts"
  ON posts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view all posts"
  ON posts FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can delete their own posts"
  ON posts FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
  ON posts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for likes
CREATE POLICY "Users can like any post"
  ON post_likes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their likes"
  ON post_likes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view all likes"
  ON post_likes FOR SELECT TO authenticated
  USING (true);

-- Create policies for comments
CREATE POLICY "Users can comment on any post"
  ON post_comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON post_comments FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view all comments"
  ON post_comments FOR SELECT TO authenticated
  USING (true);

-- Create policies for reshares
CREATE POLICY "Users can reshare any post"
  ON post_reshares FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their reshares"
  ON post_reshares FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view all reshares"
  ON post_reshares FOR SELECT TO authenticated
  USING (true);

-- Create post function
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
    EXISTS (SELECT 1 FROM favorite_foods WHERE food_id = p.food_id AND user_id = auth.uid()) as is_saved,
    0::BIGINT as reshare_count
  FROM posts p
  JOIN favorite_foods f ON p.food_id = f.id
  JOIN user_profiles up ON p.user_id = up.id
  WHERE p.id = v_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create get_explore_posts function
CREATE OR REPLACE FUNCTION get_explore_posts()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  food_id UUID,
  created_at TIMESTAMPTZ,
  caption TEXT,
  is_explore BOOLEAN,
  image_url TEXT,
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
    p.image_url,
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
    COALESCE((SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id), 0) as likes_count,
    COALESCE((SELECT COUNT(*) FROM post_comments pc WHERE pc.post_id = p.id), 0) as comments_count,
    EXISTS (SELECT 1 FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = auth.uid()) as is_liked,
    EXISTS (SELECT 1 FROM favorite_foods sf WHERE sf.id = p.food_id AND sf.user_id = auth.uid()) as is_saved,
    COALESCE((SELECT COUNT(*) FROM post_reshares pr WHERE pr.post_id = p.id), 0) as reshare_count
  FROM posts p
  JOIN favorite_foods f ON p.food_id = f.id
  JOIN user_profiles up ON p.user_id = up.id
  WHERE p.is_explore = true OR EXISTS (
    SELECT 1 FROM favorite_foods ff
    WHERE ff.id = p.food_id
    AND (ff.visibility = 'public' OR ff.user_id = auth.uid() OR ff.user_id = p.user_id)
  )
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create get_trending_posts function
CREATE OR REPLACE FUNCTION get_trending_posts()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  food_id UUID,
  created_at TIMESTAMPTZ,
  caption TEXT,
  is_explore BOOLEAN,
  image_url TEXT,
  user_info JSONB,
  food JSONB,
  likes_count BIGINT,
  comments_count BIGINT,
  is_liked BOOLEAN,
  is_saved BOOLEAN,
  reshare_count BIGINT,
  total_interactions BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH post_stats AS (
    SELECT 
      p.id,
      p.user_id,
      p.food_id,
      p.created_at,
      p.caption,
      p.is_explore,
      p.image_url,
      COALESCE(COUNT(DISTINCT pl.id), 0) + 
      COALESCE(COUNT(DISTINCT pc.id), 0) + 
      COALESCE(COUNT(DISTINCT pr.id), 0) as total_interactions
    FROM posts p
    LEFT JOIN post_likes pl ON p.id = pl.post_id
    LEFT JOIN post_comments pc ON p.id = pc.post_id
    LEFT JOIN post_reshares pr ON p.id = pr.post_id
    WHERE p.created_at >= NOW() - INTERVAL '7 days'
    GROUP BY p.id
  )
  SELECT 
    ps.id,
    ps.user_id,
    ps.food_id,
    ps.created_at,
    ps.caption,
    ps.is_explore,
    ps.image_url,
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
    COALESCE((SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = ps.id), 0) as likes_count,
    COALESCE((SELECT COUNT(*) FROM post_comments pc WHERE pc.post_id = ps.id), 0) as comments_count,
    EXISTS (SELECT 1 FROM post_likes pl WHERE pl.post_id = ps.id AND pl.user_id = auth.uid()) as is_liked,
    EXISTS (SELECT 1 FROM favorite_foods sf WHERE sf.id = ps.food_id AND sf.user_id = auth.uid()) as is_saved,
    COALESCE((SELECT COUNT(*) FROM post_reshares pr WHERE pr.post_id = ps.id), 0) as reshare_count,
    ps.total_interactions
  FROM post_stats ps
  JOIN favorite_foods f ON ps.food_id = f.id
  JOIN user_profiles up ON ps.user_id = up.id
  ORDER BY ps.total_interactions DESC, ps.created_at DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create get_user_posts function
CREATE OR REPLACE FUNCTION get_user_posts(target_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  food_id UUID,
  created_at TIMESTAMPTZ,
  caption TEXT,
  is_explore BOOLEAN,
  image_url TEXT,
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
    p.image_url,
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
    COALESCE((SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id), 0) as likes_count,
    COALESCE((SELECT COUNT(*) FROM post_comments pc WHERE pc.post_id = p.id), 0) as comments_count,
    EXISTS (SELECT 1 FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = auth.uid()) as is_liked,
    EXISTS (SELECT 1 FROM favorite_foods sf WHERE sf.id = p.food_id AND sf.user_id = auth.uid()) as is_saved,
    COALESCE((SELECT COUNT(*) FROM post_reshares pr WHERE pr.post_id = p.id), 0) as reshare_count
  FROM posts p
  JOIN favorite_foods f ON p.food_id = f.id
  JOIN user_profiles up ON p.user_id = up.id
  WHERE p.user_id = target_user_id
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 