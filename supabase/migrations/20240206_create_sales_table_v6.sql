-- Drop existing sales and related tables
DROP TABLE IF EXISTS sales CASCADE;

-- Create sales table
CREATE TABLE sales (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    stock_id UUID REFERENCES stock(id) ON DELETE CASCADE NOT NULL,
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
    USING (EXISTS (
        SELECT 1 FROM stock s
        WHERE s.id = sales.stock_id
        AND s.business_id IN (
            SELECT id FROM businesses
            WHERE owner_id = auth.uid()
        )
    ));

-- Policy for insert
CREATE POLICY "Users can insert sales for their business"
    ON sales
    FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM stock s
        WHERE s.id = stock_id
        AND s.business_id IN (
            SELECT id FROM businesses
            WHERE owner_id = auth.uid()
        )
    ));

-- Policy for update
CREATE POLICY "Users can update sales for their business"
    ON sales
    FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM stock s
        WHERE s.id = sales.stock_id
        AND s.business_id IN (
            SELECT id FROM businesses
            WHERE owner_id = auth.uid()
        )
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM stock s
        WHERE s.id = stock_id
        AND s.business_id IN (
            SELECT id FROM businesses
            WHERE owner_id = auth.uid()
        )
    ));

-- Policy for delete
CREATE POLICY "Users can delete sales for their business"
    ON sales
    FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM stock s
        WHERE s.id = sales.stock_id
        AND s.business_id IN (
            SELECT id FROM businesses
            WHERE owner_id = auth.uid()
        )
    ));

-- Create function to update stock quantity after sale
CREATE OR REPLACE FUNCTION update_stock_after_sale()
RETURNS TRIGGER AS $$
DECLARE
    stock_business_id UUID;
BEGIN
    -- Get the business_id from the stock item
    SELECT business_id INTO stock_business_id
    FROM stock
    WHERE id = NEW.stock_id;

    -- Verify there is enough stock
    IF NOT EXISTS (
        SELECT 1 FROM stock
        WHERE id = NEW.stock_id
        AND quantity >= NEW.quantity
    ) THEN
        RAISE EXCEPTION 'Insufficient stock quantity';
    END IF;

    -- Decrease stock quantity
    UPDATE stock
    SET quantity = quantity - NEW.quantity,
        updated_at = NOW()
    WHERE id = NEW.stock_id;
    
    -- Update the business_id on the sale to match the stock item's business
    NEW.business_id = stock_business_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update stock quantity after sale
DROP TRIGGER IF EXISTS after_sale_insert ON sales;
CREATE TRIGGER after_sale_insert
    BEFORE INSERT ON sales
    FOR EACH ROW
    EXECUTE FUNCTION update_stock_after_sale();
