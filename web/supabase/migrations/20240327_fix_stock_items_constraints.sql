-- Drop existing foreign key if it exists
ALTER TABLE IF EXISTS stock_items
DROP CONSTRAINT IF EXISTS stock_items_sme_id_fkey;

-- Add the correct foreign key constraint
ALTER TABLE stock_items
ADD CONSTRAINT stock_items_sme_id_fkey 
FOREIGN KEY (sme_id) 
REFERENCES sme_details(id)
ON DELETE CASCADE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stock_items_sme_id ON stock_items(sme_id);
CREATE INDEX IF NOT EXISTS idx_stock_items_name ON stock_items(name);

-- Add RLS policies
ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;

-- Policy for selecting stock items
CREATE POLICY select_stock_items ON stock_items
FOR SELECT TO authenticated
USING (
  sme_id IN (
    SELECT id FROM sme_details WHERE owner_id = auth.uid()
    UNION
    SELECT sme_id FROM user_profiles WHERE user_id = auth.uid()
  )
);

-- Policy for inserting stock items
CREATE POLICY insert_stock_items ON stock_items
FOR INSERT TO authenticated
WITH CHECK (
  sme_id IN (
    SELECT id FROM sme_details WHERE owner_id = auth.uid()
  )
);

-- Policy for updating stock items
CREATE POLICY update_stock_items ON stock_items
FOR UPDATE TO authenticated
USING (
  sme_id IN (
    SELECT id FROM sme_details WHERE owner_id = auth.uid()
  )
)
WITH CHECK (
  sme_id IN (
    SELECT id FROM sme_details WHERE owner_id = auth.uid()
  )
);

-- Policy for deleting stock items
CREATE POLICY delete_stock_items ON stock_items
FOR DELETE TO authenticated
USING (
  sme_id IN (
    SELECT id FROM sme_details WHERE owner_id = auth.uid()
  )
);
