-- Drop existing foreign keys and policies
DROP POLICY IF EXISTS "Users can view their own profile" ON "public"."user_profiles";
DROP POLICY IF EXISTS "Users can update their own profile" ON "public"."user_profiles";
DROP POLICY IF EXISTS "Users can insert their own profile" ON "public"."user_profiles";
ALTER TABLE IF EXISTS "public"."user_profiles" DROP CONSTRAINT IF EXISTS "user_profiles_username_fkey";
ALTER TABLE IF EXISTS "public"."user_profiles" DROP CONSTRAINT IF EXISTS "user_profiles_id_fkey";

-- Recreate the user_profiles table with proper constraints
ALTER TABLE "public"."user_profiles" 
  ALTER COLUMN "username" DROP NOT NULL,
  ADD CONSTRAINT "username_unique" UNIQUE ("username"),
  ADD CONSTRAINT "user_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile"
ON "public"."user_profiles"
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON "public"."user_profiles"
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON "public"."user_profiles"
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Grant necessary permissions
GRANT ALL ON "public"."user_profiles" TO authenticated;
GRANT ALL ON "public"."user_profiles" TO service_role;

-- Create or replace the username availability check function
CREATE OR REPLACE FUNCTION public.check_username_availability(username text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE user_profiles.username = check_username_availability.username
  );
END;
$$; 