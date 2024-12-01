-- Create sales table
CREATE TABLE IF NOT EXISTS sales (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
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
CREATE POLICY "Users can view sales for their business"
    ON sales
    FOR SELECT
    USING (
        business_id IN (
            SELECT id FROM businesses
            WHERE owner_id = auth.uid()
        )
    );

-- Policy for insert
CREATE POLICY "Users can insert sales for their business"
    ON sales
    FOR INSERT
    WITH CHECK (
        business_id IN (
            SELECT id FROM businesses
            WHERE owner_id = auth.uid()
        )
    );

-- Policy for update
CREATE POLICY "Users can update sales for their business"
    ON sales
    FOR UPDATE
    USING (
        business_id IN (
            SELECT id FROM businesses
            WHERE owner_id = auth.uid()
        )
    )
    WITH CHECK (
        business_id IN (
            SELECT id FROM businesses
            WHERE owner_id = auth.uid()
        )
    );

-- Policy for delete
CREATE POLICY "Users can delete sales for their business"
    ON sales
    FOR DELETE
    USING (
        business_id IN (
            SELECT id FROM businesses
            WHERE owner_id = auth.uid()
        )
    );

-- Create function to update stock quantity after sale
CREATE OR REPLACE FUNCTION update_stock_after_sale()
RETURNS TRIGGER AS $$
BEGIN
    -- Verify the stock item belongs to the same business as the sale
    IF NOT EXISTS (
        SELECT 1 FROM stock_items
        WHERE id = NEW.stock_item_id
        AND business_id = NEW.business_id
    ) THEN
        RAISE EXCEPTION 'Stock item does not belong to the same business as the sale';
    END IF;

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
    WHERE id = NEW.stock_item_id
    AND business_id = NEW.business_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update stock quantity after sale
DROP TRIGGER IF EXISTS after_sale_insert ON sales;
CREATE TRIGGER after_sale_insert
    AFTER INSERT ON sales
    FOR EACH ROW
    EXECUTE FUNCTION update_stock_after_sale();
