-- Drop and recreate the profile creation trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    metadata_role text;
    metadata_full_name text;
    metadata_email text;
    metadata_boss_id uuid;
BEGIN
    -- Extract values from raw_user_meta_data
    metadata_role := COALESCE(NEW.raw_user_meta_data->>'role', 'associate');
    metadata_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
    metadata_email := COALESCE(NEW.raw_user_meta_data->>'email', NEW.email);
    metadata_boss_id := (NEW.raw_user_meta_data->>'boss_id')::uuid;

    -- Insert into profiles
    INSERT INTO public.profiles (
        id,
        full_name,
        email,
        role,
        boss_id,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        metadata_full_name,
        metadata_email,
        metadata_role,
        metadata_boss_id,
        NOW(),
        NOW()
    );

    -- If role is boss, create SME details
    IF metadata_role = 'boss' THEN
        INSERT INTO public.sme_details (
            owner_id,
            business_name,
            created_at,
            updated_at
        ) VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'business_name', ''),
            NOW(),
            NOW()
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update SME details table
ALTER TABLE public.sme_details 
ADD COLUMN IF NOT EXISTS business_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- Add check constraint for status
ALTER TABLE public.sme_details 
DROP CONSTRAINT IF EXISTS sme_details_status_check;

ALTER TABLE public.sme_details
ADD CONSTRAINT sme_details_status_check 
CHECK (status IN ('active', 'inactive', 'pending'));

-- Add check constraint for business_type
ALTER TABLE public.sme_details 
DROP CONSTRAINT IF EXISTS sme_details_business_type_check;

ALTER TABLE public.sme_details
ADD CONSTRAINT sme_details_business_type_check 
CHECK (business_type IN (
    'retail', 
    'service', 
    'manufacturing', 
    'technology', 
    'food_and_beverage',
    'other'
));

-- Create a function to update user profile
CREATE OR REPLACE FUNCTION public.update_user_profile(
    p_user_id uuid,
    p_full_name text,
    p_email text,
    p_business_name text DEFAULT NULL,
    p_business_type text DEFAULT NULL,
    p_status text DEFAULT NULL
) RETURNS json AS $$
DECLARE
    v_user_role text;
    v_result json;
BEGIN
    -- Get user's role
    SELECT role INTO v_user_role
    FROM public.profiles
    WHERE id = p_user_id;

    -- Update profile
    UPDATE public.profiles
    SET 
        full_name = p_full_name,
        email = p_email,
        updated_at = NOW()
    WHERE id = p_user_id;

    -- If user is a boss and business_name is provided, update SME details
    IF v_user_role = 'boss' THEN
        UPDATE public.sme_details
        SET 
            business_name = COALESCE(p_business_name, business_name),
            business_type = COALESCE(p_business_type, business_type),
            status = COALESCE(p_status, status),
            updated_at = NOW()
        WHERE owner_id = p_user_id;
    END IF;

    -- Return updated profile data
    SELECT json_build_object(
        'profile', row_to_json(p),
        'sme', CASE 
            WHEN v_user_role = 'boss' THEN row_to_json(s)
            ELSE NULL
        END
    ) INTO v_result
    FROM public.profiles p
    LEFT JOIN public.sme_details s ON p.id = s.owner_id
    WHERE p.id = p_user_id;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the new function
GRANT EXECUTE ON FUNCTION public.update_user_profile TO authenticated;
