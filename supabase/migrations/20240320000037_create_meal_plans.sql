-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own meal plans" ON public.meal_plans;
DROP POLICY IF EXISTS "Users can create their own meal plans" ON public.meal_plans;
DROP POLICY IF EXISTS "Users can update their own meal plans" ON public.meal_plans;
DROP POLICY IF EXISTS "Users can delete their own meal plans" ON public.meal_plans;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_meal_plan_updated_at_trigger ON public.meal_plans;
DROP FUNCTION IF EXISTS update_meal_plan_updated_at();

-- Create meal_plans table
CREATE TABLE IF NOT EXISTS public.meal_plans (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    name text,
    foods jsonb DEFAULT '[]'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, name)
);

-- Enable RLS
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;

-- Create policies
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
GRANT ALL ON public.meal_plans TO authenticated;

-- Create trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_meal_plan_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_meal_plan_updated_at_trigger
    BEFORE UPDATE ON public.meal_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_meal_plan_updated_at(); 