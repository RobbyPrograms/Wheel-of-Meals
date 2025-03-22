-- Check if table exists and create it if it doesn't
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id uuid NOT NULL PRIMARY KEY,
    username text,
    email text,
    display_name text,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT user_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT username_unique UNIQUE (username)
);

-- Verify the table structure
SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'user_profiles'; 