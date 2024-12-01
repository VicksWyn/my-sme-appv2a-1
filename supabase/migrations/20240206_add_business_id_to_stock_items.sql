-- Add business_id column to stock_items if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stock_items' AND column_name = 'business_id'
    ) THEN
        ALTER TABLE stock_items ADD COLUMN business_id UUID REFERENCES businesses(id);
    END IF;
END $$;

-- Update existing stock items to link with businesses through their creators
UPDATE stock_items s
SET business_id = p.business_id
FROM profiles p
WHERE s.created_by = p.id
AND s.business_id IS NULL;

-- Make business_id required after updating existing records
ALTER TABLE stock_items ALTER COLUMN business_id SET NOT NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_stock_items_business_id ON stock_items(business_id);

-- Update RLS policies to include business_id check
DROP POLICY IF EXISTS "Users can view their stock items" ON stock_items;
CREATE POLICY "Users can view their stock items"
    ON stock_items
    FOR SELECT
    USING (business_id IN (
        SELECT id FROM businesses
        WHERE owner_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can insert their stock items" ON stock_items;
CREATE POLICY "Users can insert their stock items"
    ON stock_items
    FOR INSERT
    WITH CHECK (business_id IN (
        SELECT id FROM businesses
        WHERE owner_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can update their stock items" ON stock_items;
CREATE POLICY "Users can update their stock items"
    ON stock_items
    FOR UPDATE
    USING (business_id IN (
        SELECT id FROM businesses
        WHERE owner_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can delete their stock items" ON stock_items;
CREATE POLICY "Users can delete their stock items"
    ON stock_items
    FOR DELETE
    USING (business_id IN (
        SELECT id FROM businesses
        WHERE owner_id = auth.uid()
    ));
