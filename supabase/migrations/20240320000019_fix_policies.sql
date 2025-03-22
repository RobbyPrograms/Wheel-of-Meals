-- First, drop all existing policies
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON "public"."user_profiles";
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON "public"."user_profiles";
DROP POLICY IF EXISTS "Enable read access for everyone" ON "public"."user_profiles";
DROP POLICY IF EXISTS "Enable update for users based on id" ON "public"."user_profiles";
DROP POLICY IF EXISTS "Users can insert their own profile" ON "public"."user_profiles";
DROP POLICY IF EXISTS "Users can update their own profile" ON "public"."user_profiles";
DROP POLICY IF EXISTS "Users can view their own profile" ON "public"."user_profiles";
DROP POLICY IF EXISTS "Users can view posts from friends" ON "public"."user_profiles";

-- Create clean, clear policies
CREATE POLICY "Enable read own profile"
ON "public"."user_profiles"
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Enable insert own profile"
ON "public"."user_profiles"
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update own profile"
ON "public"."user_profiles"
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Grant necessary permissions
GRANT ALL ON "public"."user_profiles" TO authenticated;
GRANT ALL ON "public"."user_profiles" TO service_role; 