-- Drop existing stock_items policies
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON stock_items;
DROP POLICY IF EXISTS "Enable update for owners" ON stock_items;
DROP POLICY IF EXISTS "Enable delete for owners" ON stock_items;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON stock_items;

-- Create new policies with proper role checks
CREATE POLICY "Enable read for authenticated users"
    ON stock_items FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users"
    ON stock_items FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('owner', 'associate')
        )
    );

CREATE POLICY "Enable update for owners"
    ON stock_items FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'owner'
        )
    );

CREATE POLICY "Enable delete for owners"
    ON stock_items FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'owner'
        )
    );

-- Enable RLS on stock_items
ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;

-- Ensure stock_items table has correct structure
CREATE TABLE IF NOT EXISTS stock_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    name TEXT NOT NULL,
    description TEXT,
    quantity INTEGER NOT NULL DEFAULT 0,
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    category TEXT,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add indexes
CREATE INDEX IF NOT EXISTS stock_items_owner_id_idx ON stock_items(owner_id);
CREATE INDEX IF NOT EXISTS stock_items_category_idx ON stock_items(category);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_stock_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_stock_items_updated_at ON stock_items;
CREATE TRIGGER update_stock_items_updated_at
    BEFORE UPDATE ON stock_items
    FOR EACH ROW
    EXECUTE FUNCTION update_stock_items_updated_at();

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'stock_items';
