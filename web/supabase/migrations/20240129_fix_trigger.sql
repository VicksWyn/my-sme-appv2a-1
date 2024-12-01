-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_auth_user_created();

-- Create the function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    _role TEXT;
BEGIN
    -- Get role from metadata, default to 'boss' if not specified
    _role := COALESCE(NEW.raw_user_meta_data->>'role', 'boss');
    
    -- Insert into profiles
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        role,
        boss_id,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        _role,
        CASE WHEN _role = 'boss' THEN NEW.id ELSE NULL END,
        NOW(),
        NOW()
    );

    -- Log the successful creation
    RAISE NOTICE 'Profile created for user %', NEW.id;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log any errors
    RAISE NOTICE 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_auth_user_created();

-- Verify trigger is created
SELECT pg_get_triggerdef(oid) 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;
