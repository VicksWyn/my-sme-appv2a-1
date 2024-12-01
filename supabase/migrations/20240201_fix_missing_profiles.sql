-- Function to create missing profiles
CREATE OR REPLACE FUNCTION create_missing_profiles() RETURNS void AS $$
DECLARE
    auth_user RECORD;
BEGIN
    -- Loop through auth.users that don't have profiles
    FOR auth_user IN 
        SELECT au.id, au.email
        FROM auth.users au
        LEFT JOIN profiles p ON au.id = p.id
        WHERE p.id IS NULL
    LOOP
        -- Create a new business for the user (assuming they're a boss)
        WITH new_business AS (
            INSERT INTO businesses (name, associate_slots)
            VALUES ('Business-' || auth_user.id::text, 2)
            RETURNING id
        )
        -- Create profile as boss
        INSERT INTO profiles (id, email, business_id, role)
        SELECT 
            auth_user.id,
            auth_user.email,
            new_business.id,
            'boss'
        FROM new_business;
        
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT create_missing_profiles();

-- Drop the function after use
DROP FUNCTION create_missing_profiles();
