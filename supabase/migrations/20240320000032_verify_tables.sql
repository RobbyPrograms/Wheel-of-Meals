-- Drop existing objects first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create or replace the user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id uuid PRIMARY KEY,
    email text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Add foreign key if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'user_profiles_id_fkey'
    ) THEN
        ALTER TABLE public.user_profiles 
        ADD CONSTRAINT user_profiles_id_fkey 
        FOREIGN KEY (id) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE;
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error adding foreign key: %', SQLERRM;
END $$;

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable insert for service role only" ON public.user_profiles;

-- Create policies
CREATE POLICY "Enable read access for all users" ON public.user_profiles
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for service role only" ON public.user_profiles
    FOR INSERT TO service_role
    WITH CHECK (true);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Create trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email)
    VALUES (new.id, new.email);
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