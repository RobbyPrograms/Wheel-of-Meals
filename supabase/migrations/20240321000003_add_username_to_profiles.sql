-- Add username column to user_profiles if it doesn't exist
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Add constraint to ensure username is at least 3 characters
ALTER TABLE public.user_profiles
ADD CONSTRAINT username_min_length CHECK (char_length(username) >= 3);

-- Add constraint to ensure username only contains valid characters
ALTER TABLE public.user_profiles
ADD CONSTRAINT username_valid_chars CHECK (username ~ '^[a-zA-Z0-9_]+$');

-- Update existing profiles with default usernames
UPDATE public.user_profiles
SET username = 'user_' || substr(id::text, 1, 8)
WHERE username IS NULL;

-- Make username required for future inserts
ALTER TABLE public.user_profiles
ALTER COLUMN username SET NOT NULL; 