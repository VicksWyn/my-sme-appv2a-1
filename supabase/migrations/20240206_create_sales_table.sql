-- Create sales table
CREATE TABLE IF NOT EXISTS sales (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) NOT NULL,
    stock_item_id UUID REFERENCES stock_items(id) NOT NULL,
    quantity DECIMAL NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL NOT NULL CHECK (unit_price >= 0),
    total_amount DECIMAL NOT NULL CHECK (total_amount >= 0),
    sale_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_by UUID REFERENCES profiles(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    customer_name TEXT,
    payment_method TEXT CHECK (payment_method IN ('cash', 'mpesa', 'bank_transfer', 'credit')),
    notes TEXT
);

-- Add RLS policies
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Policy for select
CREATE POLICY "Users can view their business sales"
    ON sales
    FOR SELECT
    USING (business_id IN (
        SELECT business_id FROM profiles
        WHERE id = auth.uid()
    ));

-- Policy for insert
CREATE POLICY "Users can insert sales for their business"
    ON sales
    FOR INSERT
    WITH CHECK (business_id IN (
        SELECT business_id FROM profiles
        WHERE id = auth.uid()
    ));

-- Policy for update
CREATE POLICY "Users can update their business sales"
    ON sales
    FOR UPDATE
    USING (business_id IN (
        SELECT business_id FROM profiles
        WHERE id = auth.uid()
    ))
    WITH CHECK (business_id IN (
        SELECT business_id FROM profiles
        WHERE id = auth.uid()
    ));

-- Policy for delete
CREATE POLICY "Users can delete their business sales"
    ON sales
    FOR DELETE
    USING (business_id IN (
        SELECT business_id FROM profiles
        WHERE id = auth.uid()
    ));

-- Create function to update stock quantity after sale
CREATE OR REPLACE FUNCTION update_stock_after_sale()
RETURNS TRIGGER AS $$
BEGIN
    -- Decrease stock quantity
    UPDATE stock_items
    SET quantity = quantity - NEW.quantity,
        updated_at = NOW()
    WHERE id = NEW.stock_item_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update stock quantity after sale
CREATE TRIGGER after_sale_insert
    AFTER INSERT ON sales
    FOR EACH ROW
    EXECUTE FUNCTION update_stock_after_sale();
