-- Drop existing foreign key constraints if they exist
ALTER TABLE IF EXISTS sme_details 
  DROP CONSTRAINT IF EXISTS sme_details_owner_id_fkey;

-- Modify the sme_details table to use profiles instead of auth.users
ALTER TABLE sme_details
  ADD CONSTRAINT sme_details_owner_id_fkey 
  FOREIGN KEY (owner_id) 
  REFERENCES profiles(id)
  ON DELETE CASCADE;

-- Create or replace the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- First create the profile
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'role'
  );

  -- If the user is a boss, create their business
  IF (new.raw_user_meta_data->>'role' = 'boss') THEN
    INSERT INTO public.sme_details (
      owner_id,
      business_name,
      registration_number,
      business_address,
      business_phone
    )
    VALUES (
      new.id,
      new.raw_user_meta_data->>'business_name',
      new.raw_user_meta_data->>'registration_number',
      new.raw_user_meta_data->>'business_address',
      new.raw_user_meta_data->>'business_phone'
    );
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
