-- Create friends table
CREATE TABLE IF NOT EXISTS friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'accepted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- Enable RLS
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own friendships"
  ON friendships FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friend requests"
  ON friendships FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own friendships"
  ON friendships FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Function to send friend request
CREATE OR REPLACE FUNCTION send_friend_request(p_friend_id UUID)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_existing_request UUID;
BEGIN
  -- Check if request already exists
  SELECT id INTO v_existing_request
  FROM friendships
  WHERE (user_id = auth.uid() AND friend_id = p_friend_id)
     OR (user_id = p_friend_id AND friend_id = auth.uid());

  IF v_existing_request IS NOT NULL THEN
    RETURN QUERY SELECT false, 'Friend request already exists'::TEXT;
    RETURN;
  END IF;

  -- Create friend request
  INSERT INTO friendships (user_id, friend_id, status)
  VALUES (auth.uid(), p_friend_id, 'pending');

  RETURN QUERY SELECT true, 'Friend request sent successfully'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to accept friend request
CREATE OR REPLACE FUNCTION accept_friend_request(p_friendship_id UUID)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
) AS $$
BEGIN
  UPDATE friendships
  SET status = 'accepted',
      updated_at = NOW()
  WHERE id = p_friendship_id
    AND friend_id = auth.uid()
    AND status = 'pending';

  IF FOUND THEN
    RETURN QUERY SELECT true, 'Friend request accepted'::TEXT;
  ELSE
    RETURN QUERY SELECT false, 'Friend request not found or already accepted'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get friends feed
CREATE OR REPLACE FUNCTION get_friends_posts()
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
  is_reposted BOOLEAN,
  reposted_by_username TEXT,
  reposted_by_display_name TEXT,
  repost_created_at TIMESTAMPTZ
) AS $$
WITH friends AS (
  SELECT 
    CASE 
      WHEN user_id = auth.uid() THEN friend_id
      ELSE user_id
    END as friend_id
  FROM friendships
  WHERE (user_id = auth.uid() OR friend_id = auth.uid())
    AND status = 'accepted'
),
combined_posts AS (
  -- Original posts from friends
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
    u.avatar_url,
    COALESCE((SELECT COUNT(*) FROM post_likes WHERE post_id = p.id), 0)::BIGINT as likes_count,
    COALESCE((SELECT COUNT(*) FROM post_reposts WHERE post_id = p.id), 0)::BIGINT as reposts_count,
    EXISTS (SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = auth.uid()) as is_liked,
    EXISTS (SELECT 1 FROM post_reposts WHERE post_id = p.id AND user_id = auth.uid()) as is_reposted,
    NULL::TEXT as reposted_by_username,
    NULL::TEXT as reposted_by_display_name,
    NULL::TIMESTAMPTZ as repost_created_at,
    p.created_at as sort_date
  FROM posts p
  JOIN favorite_foods f ON p.food_id = f.id
  JOIN user_profiles u ON p.user_id = u.id
  JOIN friends fr ON p.user_id = fr.friend_id

  UNION ALL

  -- Reposts by friends
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
    u.avatar_url,
    COALESCE((SELECT COUNT(*) FROM post_likes WHERE post_id = p.id), 0)::BIGINT as likes_count,
    COALESCE((SELECT COUNT(*) FROM post_reposts WHERE post_id = p.id), 0)::BIGINT as reposts_count,
    EXISTS (SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = auth.uid()) as is_liked,
    EXISTS (SELECT 1 FROM post_reposts WHERE post_id = p.id AND user_id = auth.uid()) as is_reposted,
    ru.username as reposted_by_username,
    ru.display_name as reposted_by_display_name,
    r.created_at as repost_created_at,
    r.created_at as sort_date
  FROM posts p
  JOIN favorite_foods f ON p.food_id = f.id
  JOIN user_profiles u ON p.user_id = u.id
  JOIN post_reposts r ON r.post_id = p.id
  JOIN user_profiles ru ON ru.id = r.user_id
  JOIN friends fr ON r.user_id = fr.friend_id
)
SELECT 
  cp.id,
  cp.user_id,
  cp.food_id,
  cp.caption,
  cp.created_at,
  cp.is_explore,
  cp.food_name,
  cp.food_ingredients,
  cp.food_recipe,
  cp.food_meal_types,
  cp.food_visibility,
  cp.username,
  cp.display_name,
  cp.avatar_url,
  cp.likes_count,
  cp.reposts_count,
  cp.is_liked,
  cp.is_reposted,
  cp.reposted_by_username,
  cp.reposted_by_display_name,
  cp.repost_created_at
FROM combined_posts cp
ORDER BY cp.sort_date DESC;
$$ LANGUAGE sql SECURITY DEFINER; 