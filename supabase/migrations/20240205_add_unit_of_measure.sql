-- Create enum type for unit of measure
CREATE TYPE unit_measure AS ENUM (
    'piece',
    'kg',
    'g',
    'l',
    'ml',
    'm',
    'cm',
    'box',
    'pack'
);

-- Add unit_of_measure column to stock_items table
ALTER TABLE stock_items
ADD COLUMN unit_of_measure unit_measure NOT NULL DEFAULT 'piece';

-- Add index for better querying by unit of measure
CREATE INDEX idx_stock_items_unit_measure ON stock_items(unit_of_measure);
