-- Create a function to handle SME profile creation in a single transaction
CREATE OR REPLACE FUNCTION create_sme_profile(
  p_owner_id UUID,
  p_business_name TEXT,
  p_business_type TEXT,
  p_address TEXT,
  p_phone TEXT,
  p_registration_number TEXT
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sme_id UUID;
  v_result json;
BEGIN
  -- Start transaction
  BEGIN
    -- Insert into sme_details
    INSERT INTO sme_details (
      owner_id,
      business_name,
      business_type,
      address,
      phone,
      registration_number,
      status
    ) VALUES (
      p_owner_id,
      p_business_name,
      p_business_type,
      p_address,
      p_phone,
      p_registration_number,
      'active'
    ) RETURNING id INTO v_sme_id;

    -- Update user profile with SME ID and role
    UPDATE profiles
    SET 
      sme_id = v_sme_id,
      role = 'boss',
      updated_at = NOW()
    WHERE id = p_owner_id;

    -- Prepare the result
    SELECT json_build_object(
      'id', v_sme_id,
      'business_name', p_business_name,
      'business_type', p_business_type,
      'status', 'active'
    ) INTO v_result;

    -- Return the result
    RETURN v_result;
  EXCEPTION
    WHEN OTHERS THEN
      -- Roll back the transaction
      RAISE EXCEPTION 'Failed to create SME profile: %', SQLERRM;
  END;
END;
$$;
