-- First, remove the existing constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Make email nullable since we get it from auth.users
ALTER TABLE profiles ALTER COLUMN email DROP NOT NULL;

-- Add phone_number if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'phone_number'
    ) THEN
        ALTER TABLE profiles ADD COLUMN phone_number TEXT;
    END IF;
END $$;

-- Drop dependent policies first
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON stock_items;
DROP POLICY IF EXISTS "Enable update for owners" ON stock_items;

-- Update existing roles to lowercase
UPDATE profiles 
SET role = CASE 
    WHEN LOWER(role) = 'boss' THEN 'owner'
    ELSE LOWER(role)
END;

-- Add the new role constraint
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('owner', 'associate'));

-- Recreate the stock_items policies with correct role values
CREATE POLICY "Enable insert for authenticated users" ON stock_items
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('owner', 'associate')
        )
    );

CREATE POLICY "Enable update for owners" ON stock_items
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'owner'
        )
    );

-- Add RLS policy for profile creation
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
CREATE POLICY "Enable insert for authenticated users only" 
    ON profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- Add RLS policy for profile updates
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Add RLS policy for profile viewing
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Ensure the profiles table has the correct structure
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role = lower(role)) DEFAULT 'owner',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    full_name TEXT,
    phone_number TEXT
);

-- Add indexes
CREATE INDEX IF NOT EXISTS profiles_id_idx ON profiles(id);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles(role);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_updated_at();

-- Verify the changes
SELECT 
    table_schema, 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
