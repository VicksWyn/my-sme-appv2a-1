-- Add cost_price column to stock_items table
ALTER TABLE stock_items
ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2) DEFAULT 0.00;
