-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS debug_get_profile(UUID);
DROP FUNCTION IF EXISTS debug_list_profiles();

-- Create debug function to get profile directly
CREATE OR REPLACE FUNCTION debug_get_profile(user_id UUID)
RETURNS TABLE (
    id UUID,
    role TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    full_name TEXT,
    phone_number TEXT,
    auth_valid BOOLEAN,
    profile_exists BOOLEAN,
    rls_working BOOLEAN
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    auth_valid BOOLEAN;
    profile_exists BOOLEAN;
    rls_working BOOLEAN;
BEGIN
    -- Check if user exists in auth.users
    SELECT EXISTS (
        SELECT 1 FROM auth.users WHERE id = user_id
    ) INTO auth_valid;

    -- Check if profile exists
    SELECT EXISTS (
        SELECT 1 FROM profiles WHERE id = user_id
    ) INTO profile_exists;

    -- Check if RLS is working
    BEGIN
        EXECUTE format('SET LOCAL ROLE authenticated');
        SELECT EXISTS (
            SELECT 1 FROM profiles WHERE id = user_id
        ) INTO rls_working;
        RESET ROLE;
    EXCEPTION WHEN OTHERS THEN
        rls_working := false;
    END;

    RETURN QUERY
    SELECT 
        p.id, 
        p.role, 
        p.created_at, 
        p.updated_at, 
        p.full_name, 
        p.phone_number,
        auth_valid,
        profile_exists,
        rls_working
    FROM profiles p
    WHERE p.id = user_id;
END;
$$;

-- Create debug function to list all profiles
CREATE OR REPLACE FUNCTION debug_list_profiles()
RETURNS TABLE (
    id UUID,
    role TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    full_name TEXT,
    phone_number TEXT,
    auth_valid BOOLEAN
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id, 
        p.role, 
        p.created_at, 
        p.updated_at, 
        p.full_name, 
        p.phone_number,
        EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.id) as auth_valid
    FROM profiles p
    LIMIT 10;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION debug_get_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION debug_list_profiles() TO authenticated;

-- Verify functions exist and are accessible
SELECT 
    p.proname as function_name,
    pg_get_function_result(p.oid) as result_type,
    pg_get_function_arguments(p.oid) as arguments,
    CASE p.prosecdef 
        WHEN true THEN 'security definer'
        ELSE 'security invoker'
    END as security,
    array_to_string(p.proacl, ', ') as privileges
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname LIKE 'debug_%';
