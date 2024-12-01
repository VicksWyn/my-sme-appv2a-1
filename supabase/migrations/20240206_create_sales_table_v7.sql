-- Drop existing sales and related tables
DROP TABLE IF EXISTS sales CASCADE;

-- Create sales table
CREATE TABLE sales (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    stock_item_id UUID REFERENCES stock_items(id) ON DELETE CASCADE NOT NULL,
    quantity DECIMAL NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL NOT NULL CHECK (unit_price >= 0),
    total_amount DECIMAL NOT NULL CHECK (total_amount >= 0),
    sale_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    customer_name TEXT,
    payment_method TEXT CHECK (payment_method IN ('cash', 'mpesa', 'bank_transfer', 'credit')),
    notes TEXT
);

-- Add RLS policies
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Policy for select
CREATE POLICY "Users can view their sales"
    ON sales
    FOR SELECT
    USING (
        created_by = auth.uid()
        OR 
        EXISTS (
            SELECT 1 FROM businesses b
            WHERE b.owner_id = auth.uid()
            AND EXISTS (
                SELECT 1 FROM stock_items si
                WHERE si.id = sales.stock_item_id
                AND si.created_by IN (
                    SELECT id FROM profiles
                    WHERE business_id = b.id
                )
            )
        )
    );

-- Policy for insert
CREATE POLICY "Users can insert sales"
    ON sales
    FOR INSERT
    WITH CHECK (
        auth.uid() = created_by
        AND
        EXISTS (
            SELECT 1 FROM stock_items si
            WHERE si.id = stock_item_id
            AND si.created_by IN (
                SELECT p.id FROM profiles p
                JOIN businesses b ON p.business_id = b.id
                WHERE b.owner_id = auth.uid()
                OR p.id = auth.uid()
            )
        )
    );

-- Policy for update/delete
CREATE POLICY "Users can update their sales"
    ON sales
    FOR UPDATE
    USING (
        created_by = auth.uid()
        OR 
        EXISTS (
            SELECT 1 FROM businesses b
            WHERE b.owner_id = auth.uid()
            AND EXISTS (
                SELECT 1 FROM stock_items si
                WHERE si.id = sales.stock_item_id
                AND si.created_by IN (
                    SELECT id FROM profiles
                    WHERE business_id = b.id
                )
            )
        )
    );

CREATE POLICY "Users can delete their sales"
    ON sales
    FOR DELETE
    USING (
        created_by = auth.uid()
        OR 
        EXISTS (
            SELECT 1 FROM businesses b
            WHERE b.owner_id = auth.uid()
            AND EXISTS (
                SELECT 1 FROM stock_items si
                WHERE si.id = sales.stock_item_id
                AND si.created_by IN (
                    SELECT id FROM profiles
                    WHERE business_id = b.id
                )
            )
        )
    );

-- Create function to update stock quantity after sale
CREATE OR REPLACE FUNCTION update_stock_after_sale()
RETURNS TRIGGER AS $$
BEGIN
    -- Verify there is enough stock
    IF NOT EXISTS (
        SELECT 1 FROM stock_items
        WHERE id = NEW.stock_item_id
        AND quantity >= NEW.quantity
    ) THEN
        RAISE EXCEPTION 'Insufficient stock quantity';
    END IF;

    -- Decrease stock quantity
    UPDATE stock_items
    SET quantity = quantity - NEW.quantity,
        updated_at = NOW()
    WHERE id = NEW.stock_item_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update stock quantity after sale
DROP TRIGGER IF EXISTS after_sale_insert ON sales;
CREATE TRIGGER after_sale_insert
    BEFORE INSERT ON sales
    FOR EACH ROW
    EXECUTE FUNCTION update_stock_after_sale();
