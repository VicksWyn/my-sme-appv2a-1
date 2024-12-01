-- Update the handle_new_user function to use metadata
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    -- Create user profile using metadata
    INSERT INTO user_profiles (
        user_id,
        email,
        name,
        role,
        sme_name,
        max_associates
    )
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        COALESCE(NEW.raw_user_meta_data->>'role', 'Boss'),
        COALESCE(NEW.raw_user_meta_data->>'sme_name', 'My Business'),
        COALESCE((NEW.raw_user_meta_data->>'max_associates')::integer, 2)
    );
    
    -- Create new SME details
    INSERT INTO sme_details (
        business_name,
        owner_id
    )
    VALUES (
        COALESCE(NEW.raw_user_meta_data->>'sme_name', 'My Business'),
        NEW.id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
