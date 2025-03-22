-- Drop existing table if it exists
DROP TABLE IF EXISTS public.friends CASCADE;

-- Create friends table
CREATE TABLE IF NOT EXISTS public.friends (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, friend_id),
    CONSTRAINT no_self_friendship CHECK (user_id != friend_id)
);

-- Enable RLS
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own friend connections"
    ON public.friends FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can send friend requests"
    ON public.friends FOR INSERT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can accept/reject friend requests"
    ON public.friends FOR UPDATE
    USING (auth.uid() = friend_id)
    WITH CHECK (status IN ('accepted', 'rejected'));

CREATE POLICY "Users can delete their own friend connections"
    ON public.friends FOR DELETE
    USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Grant permissions
GRANT ALL ON public.friends TO authenticated; 