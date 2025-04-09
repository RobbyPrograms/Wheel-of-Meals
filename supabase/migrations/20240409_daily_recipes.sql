-- Create the daily_recipes table
CREATE TABLE IF NOT EXISTS daily_recipes (
    id BIGINT PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    recipe_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create an index on the date column for faster lookups
CREATE INDEX IF NOT EXISTS idx_daily_recipes_date ON daily_recipes(date);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_daily_recipes_updated_at
    BEFORE UPDATE ON daily_recipes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 