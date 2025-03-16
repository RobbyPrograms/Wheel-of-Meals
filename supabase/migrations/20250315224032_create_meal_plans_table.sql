-- Create meal_plans table
CREATE TABLE IF NOT EXISTS meal_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    plan JSONB NOT NULL,
    no_repeat BOOLEAN DEFAULT false NOT NULL
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS meal_plans_user_id_idx ON meal_plans(user_id);
CREATE INDEX IF NOT EXISTS meal_plans_created_at_idx ON meal_plans(created_at);

-- Add RLS (Row Level Security) policies
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to select only their own meal plans
CREATE POLICY "Users can view their own meal plans"
    ON meal_plans
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy to allow users to insert their own meal plans
CREATE POLICY "Users can insert their own meal plans"
    ON meal_plans
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own meal plans
CREATE POLICY "Users can update their own meal plans"
    ON meal_plans
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy to allow users to delete their own meal plans
CREATE POLICY "Users can delete their own meal plans"
    ON meal_plans
    FOR DELETE
    USING (auth.uid() = user_id);
