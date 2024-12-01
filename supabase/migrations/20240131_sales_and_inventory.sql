-- Create enum for stock status
CREATE TYPE stock_status AS ENUM ('in_stock', 'low_stock', 'out_of_stock');

-- Create stock table
CREATE TABLE stock (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sku VARCHAR(50),
    quantity INTEGER NOT NULL DEFAULT 0,
    unit_price DECIMAL(10,2) NOT NULL,
    reorder_point INTEGER NOT NULL DEFAULT 10,
    status stock_status NOT NULL DEFAULT 'in_stock',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Create sales table
CREATE TABLE sales (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    associate_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Create sale items table for tracking individual items in a sale
CREATE TABLE sale_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
    stock_id UUID REFERENCES stock(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Add indexes for better query performance
CREATE INDEX idx_stock_business ON stock(business_id);
CREATE INDEX idx_stock_status ON stock(status);
CREATE INDEX idx_sales_business ON sales(business_id);
CREATE INDEX idx_sales_associate ON sales(associate_id);
CREATE INDEX idx_sales_created_at ON sales(created_at);
CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_sale_items_stock ON sale_items(stock_id);

-- Add RLS policies for stock table
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stock items are viewable by business owner and associates"
    ON stock FOR SELECT
    USING (
        business_id IN (
            SELECT id FROM businesses WHERE owner_id = auth.uid()
            UNION
            SELECT business_id FROM business_associates 
            WHERE associate_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Stock items are insertable by business owner"
    ON stock FOR INSERT
    WITH CHECK (
        business_id IN (
            SELECT id FROM businesses WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Stock items are updatable by business owner and associates"
    ON stock FOR UPDATE
    USING (
        business_id IN (
            SELECT id FROM businesses WHERE owner_id = auth.uid()
            UNION
            SELECT business_id FROM business_associates 
            WHERE associate_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Stock items are deletable by business owner"
    ON stock FOR DELETE
    USING (
        business_id IN (
            SELECT id FROM businesses WHERE owner_id = auth.uid()
        )
    );

-- Add RLS policies for sales table
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sales are viewable by business owner and associates"
    ON sales FOR SELECT
    USING (
        business_id IN (
            SELECT id FROM businesses WHERE owner_id = auth.uid()
            UNION
            SELECT business_id FROM business_associates 
            WHERE associate_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Sales are insertable by business owner and associates"
    ON sales FOR INSERT
    WITH CHECK (
        business_id IN (
            SELECT id FROM businesses WHERE owner_id = auth.uid()
            UNION
            SELECT business_id FROM business_associates 
            WHERE associate_id = auth.uid() AND status = 'active'
        )
    );

-- Add RLS policies for sale_items table
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sale items are viewable by business owner and associates"
    ON sale_items FOR SELECT
    USING (
        sale_id IN (
            SELECT id FROM sales WHERE business_id IN (
                SELECT id FROM businesses WHERE owner_id = auth.uid()
                UNION
                SELECT business_id FROM business_associates 
                WHERE associate_id = auth.uid() AND status = 'active'
            )
        )
    );

CREATE POLICY "Sale items are insertable by business owner and associates"
    ON sale_items FOR INSERT
    WITH CHECK (
        sale_id IN (
            SELECT id FROM sales WHERE business_id IN (
                SELECT id FROM businesses WHERE owner_id = auth.uid()
                UNION
                SELECT business_id FROM business_associates 
                WHERE associate_id = auth.uid() AND status = 'active'
            )
        )
    );

-- Create function to update stock status based on quantity and reorder point
CREATE OR REPLACE FUNCTION update_stock_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.quantity <= 0 THEN
        NEW.status = 'out_of_stock';
    ELSIF NEW.quantity <= NEW.reorder_point THEN
        NEW.status = 'low_stock';
    ELSE
        NEW.status = 'in_stock';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update stock status
CREATE TRIGGER stock_status_update
    BEFORE INSERT OR UPDATE OF quantity, reorder_point ON stock
    FOR EACH ROW
    EXECUTE FUNCTION update_stock_status();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::TEXT, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updating timestamps
CREATE TRIGGER update_stock_updated_at
    BEFORE UPDATE ON stock
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at
    BEFORE UPDATE ON sales
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
