-- Drop and recreate get_friends_posts function
DROP FUNCTION IF EXISTS get_friends_posts();

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
  -- Get all friends (both directions)
  SELECT friend_id as friend_id
  FROM friendships
  WHERE user_id = auth.uid() AND status = 'accepted'
  UNION
  SELECT user_id as friend_id
  FROM friendships
  WHERE friend_id = auth.uid() AND status = 'accepted'
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