# Supabase Setup for Wheel of Meals

Follow these steps to set up your Supabase database for the Wheel of Meals application:

## 1. Create Database Functions

First, you need to create the database functions that will help set up the tables. These functions make it easier to create the tables with the correct structure and permissions.

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Create a new query and paste the contents of the `supabase-functions.sql` file
4. Run the query to create the functions

## 2. Create Tables and Set Up Policies

You have two options for creating the necessary database tables:

### Option A: Use the Setup Page (Recommended)

1. Start your application with `npm run dev`
2. Navigate to `/setup` in your browser
3. Click the "Setup Database" button to automatically create the tables

### Option B: Manual Setup

If the setup page doesn't work, you can manually create the tables by running the following SQL commands in the Supabase SQL Editor:

```sql
-- Create favorite_foods table
CREATE TABLE IF NOT EXISTS public.favorite_foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  ingredients TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.favorite_foods ENABLE ROW LEVEL SECURITY;

-- Create policies for favorite_foods
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

-- Create meal_plans table
CREATE TABLE IF NOT EXISTS public.meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meals JSONB DEFAULT '[]',
  duration INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;

-- Create policies for meal_plans
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
```

## 3. Enable Email Authentication

1. Go to your Supabase project dashboard
2. Navigate to Authentication > Providers
3. Make sure the Email provider is enabled
4. Configure any additional settings as needed (password length, etc.)

## 4. Set Up Storage (Optional)

If you want to allow users to upload images for their meals:

1. Go to your Supabase project dashboard
2. Navigate to Storage
3. Create a new bucket called `meal-images`
4. Set the bucket's privacy to "Private"
5. Add the following policies to the bucket:

```sql
-- Allow users to view their own images
CREATE POLICY "Users can view their own meal images"
  ON storage.objects
  FOR SELECT
  USING (auth.uid() = owner);

-- Allow users to upload their own images
CREATE POLICY "Users can upload their own meal images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (auth.uid() = owner AND bucket_id = 'meal-images');

-- Allow users to update their own images
CREATE POLICY "Users can update their own meal images"
  ON storage.objects
  FOR UPDATE
  USING (auth.uid() = owner AND bucket_id = 'meal-images');

-- Allow users to delete their own images
CREATE POLICY "Users can delete their own meal images"
  ON storage.objects
  FOR DELETE
  USING (auth.uid() = owner AND bucket_id = 'meal-images');
```

## 5. Update Environment Variables

Make sure your `.env.local` file contains the correct Supabase URL and anon key:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Troubleshooting

If you encounter issues with database operations:

1. Check the browser console for detailed error messages
2. Verify that the tables exist in your Supabase database
3. Make sure Row Level Security (RLS) policies are correctly set up
4. Ensure you're properly authenticated before attempting database operations
5. Check that your user has the correct permissions

For more detailed diagnostics, visit the `/setup` page in your application to check the database status. 

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