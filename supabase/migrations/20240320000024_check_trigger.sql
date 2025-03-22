-- Check if the trigger exists
SELECT 
    event_object_schema as table_schema,
    event_object_table as table_name,
    trigger_name,
    event_manipulation as event,
    action_statement as definition
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- If no trigger exists, recreate it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.triggers 
        WHERE trigger_name = 'on_auth_user_created'
    ) THEN
        -- Create the function if it doesn't exist
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS trigger
        LANGUAGE plpgsql
        SECURITY DEFINER SET search_path = public
        AS $$
        BEGIN
            INSERT INTO public.user_profiles (id, email, username)
            VALUES (
                NEW.id,
                NEW.email,
                COALESCE(NEW.raw_user_meta_data->>'username', NULL)
            );
            RETURN NEW;
        EXCEPTION WHEN OTHERS THEN
            RAISE LOG 'Error in handle_new_user: %', SQLERRM;
            RETURN NEW;
        END;
        $$;

        -- Create the trigger
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_new_user();
    END IF;
END $$; 