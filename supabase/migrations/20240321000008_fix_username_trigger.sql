-- First, let's add a raw_user_meta_data column to store signup data if we don't have it
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS raw_user_meta_data JSONB;

-- Update the function to check for username in metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    signup_username TEXT;
BEGIN
    -- Try to get username from metadata if it exists
    signup_username := NEW.raw_user_meta_data->>'username';
    
    -- Insert profile with either provided username or generate default
    INSERT INTO public.user_profiles (id, email, username)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            signup_username,
            'user_' || substr(NEW.id::text, 1, 8)
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- No need to recreate trigger as the function is being replaced 