-- Drop existing functions and tables
DROP FUNCTION IF EXISTS create_post(UUID, TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS get_explore_posts();

-- Drop dependent tables first
DROP TABLE IF EXISTS post_reposts;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS post_reshares;
DROP TABLE IF EXISTS post_comments;
DROP TABLE IF EXISTS post_likes;
DROP TABLE IF EXISTS posts;

-- Create a simplified posts table
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  food_id UUID REFERENCES favorite_foods(id) ON DELETE CASCADE NOT NULL,
  caption TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_explore BOOLEAN DEFAULT false
);

-- Basic RLS policies
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own posts"
  ON posts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view all posts"
  ON posts FOR SELECT TO authenticated
  USING (true);

-- Simple create post function
CREATE OR REPLACE FUNCTION create_post(
  p_food_id UUID,
  p_caption TEXT DEFAULT NULL,
  p_is_explore BOOLEAN DEFAULT false,
  p_image_url TEXT DEFAULT NULL
)
RETURNS posts AS $$
  INSERT INTO posts (user_id, food_id, caption, is_explore, image_url)
  VALUES (auth.uid(), p_food_id, p_caption, p_is_explore, p_image_url)
  RETURNING *;
$$ LANGUAGE sql SECURITY DEFINER;

-- Simple get posts function
CREATE OR REPLACE FUNCTION get_explore_posts()
RETURNS SETOF posts AS $$
  SELECT * FROM posts 
  ORDER BY created_at DESC;
$$ LANGUAGE sql SECURITY DEFINER; 