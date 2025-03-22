-- Update the function to properly handle usernames from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    meta_username TEXT;
BEGIN
    -- Get username from metadata if it exists
    meta_username := NEW.raw_user_meta_data->>'username';
    
    INSERT INTO public.user_profiles (id, email, username)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            meta_username,
            'user_' || substr(NEW.id::text, 1, 8)
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 