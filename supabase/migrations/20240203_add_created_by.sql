-- Add created_by column to stock_items table initially as nullable
ALTER TABLE stock_items
ADD COLUMN created_by UUID;

-- Get the first admin user's ID (or you can specify a specific user ID)
DO $$
DECLARE
    admin_id UUID;
BEGIN
    -- Get the first admin user's ID
    SELECT id INTO admin_id FROM profiles LIMIT 1;
    
    -- Update existing records with the admin ID
    UPDATE stock_items SET created_by = admin_id WHERE created_by IS NULL;
END $$;

-- Now make the column NOT NULL and add the foreign key
ALTER TABLE stock_items
ALTER COLUMN created_by SET NOT NULL,
ADD CONSTRAINT fk_stock_items_created_by 
FOREIGN KEY (created_by) REFERENCES profiles(id);

-- Add index for better query performance
CREATE INDEX idx_stock_items_created_by ON stock_items(created_by);
