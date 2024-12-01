-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recreate the handle_new_user function with proper transaction handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    profile_id uuid;
BEGIN
    -- Create the profile first and store the ID
    INSERT INTO public.profiles (id, full_name, email, role)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'associate')
    )
    RETURNING id INTO profile_id;

    -- If the user is a boss, create their business
    IF (NEW.raw_user_meta_data->>'role' = 'boss') THEN
        INSERT INTO public.sme_details (
            owner_id,
            business_name,
            registration_number,
            business_address,
            business_phone
        )
        VALUES (
            profile_id,  -- Use the profile_id we just created
            NEW.raw_user_meta_data->>'business_name',
            NEW.raw_user_meta_data->>'registration_number',
            NEW.raw_user_meta_data->>'business_address',
            NEW.raw_user_meta_data->>'business_phone'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure proper cascade behavior for sme_details
ALTER TABLE IF EXISTS public.sme_details
    DROP CONSTRAINT IF EXISTS sme_details_owner_id_fkey;

ALTER TABLE public.sme_details
    ADD CONSTRAINT sme_details_owner_id_fkey
    FOREIGN KEY (owner_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;

-- Add RLS policies for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Add RLS policies for sme_details
ALTER TABLE public.sme_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can view their business details"
    ON public.sme_details FOR SELECT
    USING (owner_id = auth.uid());

CREATE POLICY "Business owners can update their business details"
    ON public.sme_details FOR UPDATE
    USING (owner_id = auth.uid());

CREATE POLICY "Business owners can delete their business details"
    ON public.sme_details FOR DELETE
    USING (owner_id = auth.uid());
