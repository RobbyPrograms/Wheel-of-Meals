-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    food_id UUID REFERENCES favorite_foods(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, food_id)
);

-- Create likes table
CREATE TABLE IF NOT EXISTS post_likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

-- Policies for posts
CREATE POLICY "Users can view posts from friends"
    ON posts FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM friends
            WHERE (friends.user_id = auth.uid() AND friends.friend_id = posts.user_id)
            OR (friends.friend_id = auth.uid() AND friends.user_id = posts.user_id)
            AND friends.status = 'accepted'
        )
    );

CREATE POLICY "Users can create posts"
    ON posts FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Policies for likes
CREATE POLICY "Users can view likes"
    ON post_likes FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can like posts"
    ON post_likes FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts"
    ON post_likes FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Function to get explore posts
CREATE OR REPLACE FUNCTION get_explore_posts(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    food_id UUID,
    created_at TIMESTAMPTZ,
    user JSONB,
    food JSONB,
    likes_count BIGINT,
    comments_count BIGINT,
    is_liked BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
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
        ) as user,
        jsonb_build_object(
            'id', ff.id,
            'name', ff.name,
            'ingredients', ff.ingredients,
            'recipe', ff.recipe
        ) as food,
        (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as likes_count,
        0 as comments_count,
        EXISTS (
            SELECT 1 FROM post_likes 
            WHERE post_id = p.id AND user_id = p_user_id
        ) as is_liked
    FROM posts p
    JOIN user_profiles up ON p.user_id = up.id
    JOIN favorite_foods ff ON p.food_id = ff.id
    WHERE EXISTS (
        SELECT 1 FROM friends
        WHERE (friends.user_id = p_user_id AND friends.friend_id = p.user_id)
        OR (friends.friend_id = p_user_id AND friends.user_id = p.user_id)
        AND friends.status = 'accepted'
    )
    ORDER BY p.created_at DESC
    LIMIT 50;
END;
$$;

-- Function to toggle post like
CREATE OR REPLACE FUNCTION toggle_post_like(p_post_id UUID, p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM post_likes 
        WHERE post_id = p_post_id AND user_id = p_user_id
    ) THEN
        DELETE FROM post_likes 
        WHERE post_id = p_post_id AND user_id = p_user_id;
    ELSE
        INSERT INTO post_likes (post_id, user_id)
        VALUES (p_post_id, p_user_id);
    END IF;
END;
$$; 