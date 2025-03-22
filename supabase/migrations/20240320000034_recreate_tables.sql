-- Create favorite_foods table
CREATE TABLE public.favorite_foods (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    food_name text NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, food_name)
);

-- Create meal_plans table
CREATE TABLE public.meal_plans (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    foods text[] NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.favorite_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;

-- Policies for favorite_foods
CREATE POLICY "Users can view their own favorite foods" ON public.favorite_foods
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own favorite foods" ON public.favorite_foods
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own favorite foods" ON public.favorite_foods
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorite foods" ON public.favorite_foods
    FOR DELETE USING (auth.uid() = user_id);

-- Policies for meal_plans
CREATE POLICY "Users can view their own meal plans" ON public.meal_plans
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own meal plans" ON public.meal_plans
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meal plans" ON public.meal_plans
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meal plans" ON public.meal_plans
    FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.favorite_foods TO authenticated;
GRANT ALL ON public.meal_plans TO authenticated;

-- Create updated_at trigger for meal_plans
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER handle_meal_plans_updated_at
    BEFORE UPDATE ON public.meal_plans
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at(); 