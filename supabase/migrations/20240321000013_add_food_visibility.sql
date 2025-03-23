-- Add visibility column to favorite_foods
ALTER TABLE favorite_foods ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('public', 'private'));

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own favorite foods" ON favorite_foods;
DROP POLICY IF EXISTS "Users can view friends favorite foods" ON favorite_foods;
DROP POLICY IF EXISTS "Users can manage their own favorite foods" ON favorite_foods;

-- Create updated policies
CREATE POLICY "Users can view their own favorite foods"
    ON favorite_foods FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view friends public favorite foods"
    ON favorite_foods FOR SELECT
    TO authenticated
    USING (
        visibility = 'public' AND
        EXISTS (
            SELECT 1 FROM friends
            WHERE (
                (friends.user_id = auth.uid() AND friends.friend_id = favorite_foods.user_id) OR
                (friends.friend_id = auth.uid() AND friends.user_id = favorite_foods.user_id)
            )
            AND friends.status = 'accepted'
        )
    );

CREATE POLICY "Users can manage their own favorite foods"
    ON favorite_foods FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id); 