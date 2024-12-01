-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create businesses table
CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    associate_slots INTEGER NOT NULL DEFAULT 2 CHECK (associate_slots BETWEEN 2 AND 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create profiles table with business reference
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    business_id UUID REFERENCES businesses(id),
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL CHECK (role IN ('boss', 'associate')),
    associate_number INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (business_id, associate_number)
);

-- Create stock items table
CREATE TABLE IF NOT EXISTS stock_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id),
    name TEXT NOT NULL,
    description TEXT,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    recorded_by UUID REFERENCES profiles(id)
);

-- Create sales table
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id),
    seller_id UUID REFERENCES profiles(id),
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    payment_type TEXT NOT NULL CHECK (payment_type IN ('cash', 'mpesa')),
    receipt_number TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sale items table
CREATE TABLE IF NOT EXISTS sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID REFERENCES sales(id),
    stock_item_id UUID REFERENCES stock_items(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_at_sale DECIMAL(10,2) NOT NULL CHECK (price_at_sale >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create charts table for analytics
CREATE TABLE IF NOT EXISTS charts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id),
    chart_type TEXT NOT NULL,
    duration TEXT NOT NULL CHECK (duration IN ('daily', 'weekly', 'monthly', 'quarterly', 'semi-annually', 'annually')),
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Set up Row Level Security (RLS)
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE charts ENABLE ROW LEVEL SECURITY;

-- Business policies
CREATE POLICY "Enable read for users in business" ON businesses
    FOR SELECT TO authenticated
    USING (id IN (
        SELECT business_id FROM profiles WHERE id = auth.uid()
    ));

-- Profile policies
CREATE POLICY "Enable read for users in same business" ON profiles
    FOR SELECT TO authenticated
    USING (business_id IN (
        SELECT business_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Enable boss to create associate profiles" ON profiles
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'boss'
            AND business_id = NEW.business_id
        )
    );

-- Stock policies
CREATE POLICY "Enable read for users in business" ON stock_items
    FOR SELECT TO authenticated
    USING (business_id IN (
        SELECT business_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Enable associates to record stock" ON stock_items
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND business_id = NEW.business_id
            AND role = 'associate'
        )
    );

CREATE POLICY "Enable boss to manage stock" ON stock_items
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND business_id = stock_items.business_id
            AND role = 'boss'
        )
    );

-- Sales policies
CREATE POLICY "Enable read for users in business" ON sales
    FOR SELECT TO authenticated
    USING (business_id IN (
        SELECT business_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Enable insert for authenticated users" ON sales
    FOR INSERT TO authenticated
    WITH CHECK (business_id IN (
        SELECT business_id FROM profiles WHERE id = auth.uid()
    ));

-- Sale items policies
CREATE POLICY "Enable read for users in business" ON sale_items
    FOR SELECT TO authenticated
    USING (sale_id IN (
        SELECT id FROM sales WHERE business_id IN (
            SELECT business_id FROM profiles WHERE id = auth.uid()
        )
    ));

CREATE POLICY "Enable insert for authenticated users" ON sale_items
    FOR INSERT TO authenticated
    WITH CHECK (sale_id IN (
        SELECT id FROM sales WHERE business_id IN (
            SELECT business_id FROM profiles WHERE id = auth.uid()
        )
    ));

-- Charts policies
CREATE POLICY "Enable read for boss" ON charts
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND business_id = charts.business_id
            AND role = 'boss'
        )
    );

CREATE POLICY "Enable insert for boss" ON charts
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND business_id = NEW.business_id
            AND role = 'boss'
        )
    );
