-- First, drop everything in the public schema
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO anon;
GRANT ALL ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;

-- Recreate the user_profiles table
CREATE TABLE public.user_profiles (
    id uuid PRIMARY KEY,
    email text NOT NULL,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT user_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON public.user_profiles
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for service role only" ON public.user_profiles
    FOR INSERT TO service_role
    WITH CHECK (true);

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Create trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    profile_exists boolean;
BEGIN
    -- Check if profile already exists
    SELECT EXISTS (
        SELECT 1 FROM public.user_profiles WHERE id = new.id
    ) INTO profile_exists;
    
    -- Only create profile if it doesn't exist
    IF NOT profile_exists THEN
        INSERT INTO public.user_profiles (id, email)
        VALUES (new.id, new.email);
    END IF;
    
    RETURN new;
EXCEPTION 
    WHEN others THEN
        RAISE LOG 'Error in handle_new_user: %', SQLERRM;
        RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user(); 