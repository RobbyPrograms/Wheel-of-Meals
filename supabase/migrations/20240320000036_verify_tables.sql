-- First verify if table exists with correct structure
DO $$ 
BEGIN
    -- Drop the table if it exists but with wrong structure
    DROP TABLE IF EXISTS public.favorite_foods CASCADE;
    
    -- Create the table with correct structure
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
END $$; 