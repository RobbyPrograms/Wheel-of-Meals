-- First clean up existing data and tables
DROP TRIGGER IF EXISTS posts_xp_trigger ON posts;
DROP TRIGGER IF EXISTS post_likes_xp_trigger ON post_likes;
DROP FUNCTION IF EXISTS handle_post_interaction();
DROP FUNCTION IF EXISTS award_experience_points();
DROP FUNCTION IF EXISTS get_level_progress(UUID);

-- Remove XP columns from user_profiles if they exist
ALTER TABLE public.user_profiles 
DROP COLUMN IF EXISTS experience_points,
DROP COLUMN IF EXISTS current_level;

-- Drop and recreate chef_levels table
DROP TABLE IF EXISTS public.chef_levels CASCADE;

-- Create the chef_levels table to define level thresholds
CREATE TABLE IF NOT EXISTS public.chef_levels (
    level_number INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    icon TEXT NOT NULL,
    min_xp INTEGER NOT NULL,
    division INTEGER DEFAULT 1,
    description TEXT
);

-- Insert predefined levels FIRST
INSERT INTO public.chef_levels (level_number, title, icon, min_xp, division, description) VALUES
(1, 'Kitchen Novice', '👨‍🍳', 0, 1, 'New to the kitchen but eager to learn!'),
(2, 'Apprentice Chef', '🍳', 100, 1, 'Learning the basics of cooking'),
(3, 'Apprentice Chef', '🍳', 250, 2, 'Getting comfortable in the kitchen'),
(4, 'Apprentice Chef', '🍳', 500, 3, 'Mastering fundamental techniques'),
(5, 'Apprentice Chef', '🍳', 1000, 4, 'Ready to take on new challenges'),
(6, 'Home Cook', '🏠', 2000, 1, 'Confident in creating delicious meals'),
(7, 'Home Cook', '🏠', 3500, 2, 'Experimenting with new flavors'),
(8, 'Home Cook', '🏠', 5000, 3, 'Creating unique recipe variations'),
(9, 'Home Cook', '🏠', 7000, 4, 'Mastering home cooking'),
(10, 'Culinary Enthusiast', '🌟', 10000, 1, 'Passionate about cooking'),
(11, 'Culinary Enthusiast', '🌟', 15000, 2, 'Inspiring others to cook'),
(12, 'Culinary Enthusiast', '🌟', 20000, 3, 'Creating trending recipes'),
(13, 'Culinary Enthusiast', '🌟', 30000, 4, 'A true food innovator'),
(14, 'Master Chef', '👑', 50000, 1, 'Expert in culinary arts'),
(15, 'Master Chef', '👑', 75000, 2, 'Creating culinary masterpieces'),
(16, 'Master Chef', '👑', 100000, 3, 'Leading the cooking community'),
(17, 'Master Chef', '👑', 150000, 4, 'Setting culinary trends'),
(18, 'Gourmet Guru', '🎖️', 200000, 1, 'Elite culinary influencer'),
(19, 'Gourmet Guru', '🎖️', 300000, 2, 'Renowned recipe creator'),
(20, 'Michelin Star', '⭐', 500000, 1, 'Legendary culinary master');

-- THEN add XP tracking to user_profiles after levels exist
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS experience_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_level INTEGER DEFAULT 1;

-- Add the foreign key constraint separately after both table and data exist
ALTER TABLE public.user_profiles
ADD CONSTRAINT user_profiles_current_level_fkey 
FOREIGN KEY (current_level) 
REFERENCES public.chef_levels(level_number);

-- Create function to award XP
CREATE OR REPLACE FUNCTION award_experience_points(
    user_id UUID,
    points INTEGER
) RETURNS void AS $$
DECLARE
    current_xp INTEGER;
    new_xp INTEGER;
    new_level INTEGER;
BEGIN
    -- Get current XP
    SELECT experience_points INTO current_xp
    FROM user_profiles
    WHERE id = user_id;

    -- Calculate new XP
    new_xp := COALESCE(current_xp, 0) + points;

    -- Determine new level based on XP
    SELECT level_number INTO new_level
    FROM chef_levels
    WHERE min_xp <= new_xp
    ORDER BY min_xp DESC
    LIMIT 1;

    -- Update user profile
    UPDATE user_profiles
    SET 
        experience_points = new_xp,
        current_level = new_level,
        updated_at = NOW()
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get level progress
DROP FUNCTION IF EXISTS get_level_progress(UUID);
CREATE OR REPLACE FUNCTION get_level_progress(
    user_id UUID
) RETURNS TABLE (
    current_level INTEGER,
    current_title TEXT,
    current_icon TEXT,
    current_division INTEGER,
    current_xp INTEGER,
    xp_for_next_level INTEGER,
    progress_percentage INTEGER
) AS $$
DECLARE
    user_xp INTEGER;
    next_level_xp INTEGER;
BEGIN
    -- Get user's current XP and level info
    SELECT 
        up.experience_points,
        up.current_level,
        cl.title,
        cl.icon,
        cl.division
    INTO 
        user_xp,
        current_level,
        current_title,
        current_icon,
        current_division
    FROM user_profiles up
    JOIN chef_levels cl ON up.current_level = cl.level_number
    WHERE up.id = user_id;

    -- Get XP needed for next level
    SELECT min_xp INTO next_level_xp
    FROM chef_levels
    WHERE level_number > current_level
    ORDER BY level_number
    LIMIT 1;

    -- Calculate progress percentage
    IF next_level_xp IS NOT NULL THEN
        progress_percentage := 
            ((user_xp - (SELECT min_xp FROM chef_levels WHERE level_number = current_level))::FLOAT / 
            (next_level_xp - (SELECT min_xp FROM chef_levels WHERE level_number = current_level))::FLOAT * 100)::INTEGER;
    ELSE
        -- Max level reached
        progress_percentage := 100;
    END IF;

    RETURN QUERY
    SELECT 
        current_level,
        current_title,
        current_icon,
        current_division,
        user_xp,
        COALESCE(next_level_xp, user_xp) as xp_for_next_level,
        progress_percentage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for XP awards
CREATE OR REPLACE FUNCTION handle_post_interaction() RETURNS TRIGGER AS $$
BEGIN
    -- Award XP for different actions
    CASE TG_TABLE_NAME
        WHEN 'posts' THEN
            -- Creating a new recipe post
            IF TG_OP = 'INSERT' THEN
                PERFORM award_experience_points(NEW.user_id, 50);
            END IF;
        WHEN 'post_likes' THEN
            -- Getting likes on posts
            IF TG_OP = 'INSERT' THEN
                -- Award XP to the post creator
                PERFORM award_experience_points(
                    (SELECT user_id FROM posts WHERE id = NEW.post_id),
                    10
                );
            END IF;
    END CASE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for various interactions
DROP TRIGGER IF EXISTS posts_xp_trigger ON posts;
CREATE TRIGGER posts_xp_trigger
    AFTER INSERT ON posts
    FOR EACH ROW
    EXECUTE FUNCTION handle_post_interaction();

DROP TRIGGER IF EXISTS post_likes_xp_trigger ON post_likes;
CREATE TRIGGER post_likes_xp_trigger
    AFTER INSERT ON post_likes
    FOR EACH ROW
    EXECUTE FUNCTION handle_post_interaction();

-- Enable RLS
ALTER TABLE public.chef_levels ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Chef levels are viewable by everyone"
    ON public.chef_levels FOR SELECT
    USING (true); 