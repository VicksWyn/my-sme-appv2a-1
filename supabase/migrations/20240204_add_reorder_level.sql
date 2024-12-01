-- Add reorder_level column to stock_items table
ALTER TABLE stock_items
ADD COLUMN reorder_level INTEGER NOT NULL DEFAULT 10;

-- Add an index for performance when querying low stock items
CREATE INDEX idx_stock_items_reorder ON stock_items(reorder_level);
