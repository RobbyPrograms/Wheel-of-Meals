-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;

-- Create policies
CREATE POLICY "Users can view all profiles"
    ON public.user_profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update their own profile"
    ON public.user_profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON public.user_profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id); 