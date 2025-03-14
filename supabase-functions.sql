-- Function to create the favorite_foods table
CREATE OR REPLACE FUNCTION setup_favorite_foods_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the table already exists
  IF NOT EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'favorite_foods'
  ) THEN
    -- Create the favorite_foods table
    CREATE TABLE public.favorite_foods (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      ingredients TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
    );

    -- Enable Row Level Security
    ALTER TABLE public.favorite_foods ENABLE ROW LEVEL SECURITY;

    -- Create policies
    CREATE POLICY "Users can view their own favorite foods"
      ON public.favorite_foods
      FOR SELECT
      USING (auth.uid() = user_id);

    CREATE POLICY "Users can insert their own favorite foods"
      ON public.favorite_foods
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update their own favorite foods"
      ON public.favorite_foods
      FOR UPDATE
      USING (auth.uid() = user_id);

    CREATE POLICY "Users can delete their own favorite foods"
      ON public.favorite_foods
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END;
$$;

-- Function to create the meal_plans table
CREATE OR REPLACE FUNCTION setup_meal_plans_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the table already exists
  IF NOT EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'meal_plans'
  ) THEN
    -- Create the meal_plans table
    CREATE TABLE public.meal_plans (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      meals JSONB NOT NULL,
      duration INTEGER NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
    );

    -- Enable Row Level Security
    ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;

    -- Create policies
    CREATE POLICY "Users can view their own meal plans"
      ON public.meal_plans
      FOR SELECT
      USING (auth.uid() = user_id);

    CREATE POLICY "Users can insert their own meal plans"
      ON public.meal_plans
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update their own meal plans"
      ON public.meal_plans
      FOR UPDATE
      USING (auth.uid() = user_id);

    CREATE POLICY "Users can delete their own meal plans"
      ON public.meal_plans
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END;
$$; 