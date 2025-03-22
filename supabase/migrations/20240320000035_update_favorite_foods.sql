-- Drop the existing favorite_foods table
DROP TABLE IF EXISTS public.favorite_foods CASCADE;

-- Recreate favorite_foods table with all required columns
CREATE TABLE public.favorite_foods (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    ingredients text[] DEFAULT '{}',
    recipe text,
    rating integer CHECK (rating >= 1 AND rating <= 5),
    meal_types text[] DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, name)
);

-- Enable RLS
ALTER TABLE public.favorite_foods ENABLE ROW LEVEL SECURITY;

-- Recreate policies
CREATE POLICY "Users can view their own favorite foods" ON public.favorite_foods
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own favorite foods" ON public.favorite_foods
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own favorite foods" ON public.favorite_foods
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorite foods" ON public.favorite_foods
    FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.favorite_foods TO authenticated;

-- Create updated_at trigger for favorite_foods
CREATE TRIGGER handle_favorite_foods_updated_at
    BEFORE UPDATE ON public.favorite_foods
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at(); 