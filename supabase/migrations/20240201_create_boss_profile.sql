-- Create business and profile for boss user
DO $$
DECLARE
    business_id UUID;
BEGIN
    -- Create business
    INSERT INTO businesses (name, associate_slots)
    VALUES ('My Business', 2)
    RETURNING id INTO business_id;

    -- Create boss profile
    INSERT INTO profiles (id, email, business_id, role)
    VALUES (
        '9eac8a23-dfe3-4104-b378-51e48c498c0f',
        'user@example.com',
        business_id,
        'boss'
    );
END $$;
