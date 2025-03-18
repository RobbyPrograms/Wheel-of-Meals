-- Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, username, created_at, updated_at)
    VALUES (
        NEW.id,
        COALESCE(
            (NEW.raw_user_meta_data->>'username'),
            'user_' || substr(NEW.id::text, 1, 8)
        ),
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET username = EXCLUDED.username,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 