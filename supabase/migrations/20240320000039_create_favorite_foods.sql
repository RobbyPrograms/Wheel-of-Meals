-- Drop existing table and its dependencies
DROP TABLE IF EXISTS public.favorite_foods CASCADE;

-- Create favorite_foods table
CREATE TABLE public.favorite_foods (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    ingredients text[] DEFAULT '{}',
    recipe text,
    rating integer DEFAULT 0,
    meal_types text[] DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, name)
);

-- Enable RLS
ALTER TABLE public.favorite_foods ENABLE ROW LEVEL SECURITY;

-- Create policies
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

-- Create trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_favorite_food_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_favorite_food_updated_at_trigger
    BEFORE UPDATE ON public.favorite_foods
    FOR EACH ROW
    EXECUTE FUNCTION update_favorite_food_updated_at(); 