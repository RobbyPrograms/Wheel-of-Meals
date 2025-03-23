-- Add visibility column to favorite_foods table
ALTER TABLE favorite_foods ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('public', 'private'));

-- Update RLS policies to respect visibility
DROP POLICY IF EXISTS "Users can view their own favorite foods" ON favorite_foods;
DROP POLICY IF EXISTS "Users can view their friends' public favorite foods" ON favorite_foods;
DROP POLICY IF EXISTS "Users can manage their own favorite foods" ON favorite_foods;

-- Users can view their own favorite foods (both public and private)
CREATE POLICY "Users can view their own favorite foods"
ON favorite_foods FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can view their friends' public favorite foods
CREATE POLICY "Users can view their friends' public favorite foods"
ON favorite_foods FOR SELECT
TO authenticated
USING (
  auth.uid() != user_id
  AND visibility = 'public'
  AND EXISTS (
    SELECT 1 FROM friends
    WHERE (user_id = auth.uid() AND friend_id = favorite_foods.user_id
           AND status = 'accepted')
    OR (friend_id = auth.uid() AND user_id = favorite_foods.user_id
        AND status = 'accepted')
  )
);

-- Users can manage their own favorite foods
CREATE POLICY "Users can manage their own favorite foods"
ON favorite_foods
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON favorite_foods TO authenticated; 