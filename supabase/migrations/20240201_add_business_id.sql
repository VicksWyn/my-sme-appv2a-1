-- Add business_id column to profiles if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'business_id'
    ) THEN
        ALTER TABLE profiles ADD COLUMN business_id UUID REFERENCES businesses(id);
    END IF;
END $$;

-- Update existing profiles to link with businesses
UPDATE profiles p
SET business_id = b.id
FROM businesses b
WHERE p.id = b.owner_id
AND p.business_id IS NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_business_id ON profiles(business_id);

-- Update RLS policies to use business_id
DROP POLICY IF EXISTS "Enable read for users in same business" ON profiles;
CREATE POLICY "Enable read for users in same business" ON profiles
    FOR SELECT TO authenticated
    USING (
        business_id IN (
            SELECT business_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
    );

-- Verify the changes
SELECT 
    table_schema, 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
