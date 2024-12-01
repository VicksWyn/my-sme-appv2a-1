-- Drop existing tables if they exist
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS stock CASCADE;
DROP TABLE IF EXISTS receipts CASCADE;
DROP TABLE IF EXISTS sme_details CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Create profiles table with enhanced role management
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL CHECK (role IN ('boss', 'associate')),
    boss_id UUID REFERENCES profiles(id),
    sme_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create SME details table
CREATE TABLE sme_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_name TEXT NOT NULL UNIQUE,
    owner_id UUID REFERENCES profiles(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_owner_is_boss CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = owner_id 
            AND profiles.role = 'boss'
        )
    )
);

-- Create stock table
CREATE TABLE stock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sme_id UUID REFERENCES sme_details(id) NOT NULL,
    item_name TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity >= 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price > 0),
    reorder_level INTEGER NOT NULL DEFAULT 10,
    created_by UUID REFERENCES profiles(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sales table
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sme_id UUID REFERENCES sme_details(id) NOT NULL,
    stock_id UUID REFERENCES stock(id) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price > 0),
    payment_type TEXT NOT NULL CHECK (payment_type IN ('cash', 'mpesa')),
    amount_paid DECIMAL(10,2) NOT NULL CHECK (amount_paid > 0),
    recorded_by UUID REFERENCES profiles(id) NOT NULL,
    sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create receipts table
CREATE TABLE receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID REFERENCES sales(id) NOT NULL,
    receipt_number TEXT NOT NULL UNIQUE,
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount > 0),
    created_by UUID REFERENCES profiles(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sme_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Boss can view associate profiles"
    ON profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'boss'
            AND profiles.sme_id = sme_id
        )
    );

-- SME details policies
CREATE POLICY "Users can view their SME details"
    ON sme_details FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.sme_id = id
        )
    );

CREATE POLICY "Only boss can update SME details"
    ON sme_details FOR UPDATE
    USING (owner_id = auth.uid());

-- Stock policies
CREATE POLICY "Users can view their SME's stock"
    ON stock FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.sme_id = stock.sme_id
        )
    );

CREATE POLICY "Users can insert stock"
    ON stock FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.sme_id = stock.sme_id
        )
    );

-- Sales policies
CREATE POLICY "Users can view their SME's sales"
    ON sales FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.sme_id = sales.sme_id
        )
    );

CREATE POLICY "Users can insert sales"
    ON sales FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.sme_id = sales.sme_id
        )
    );

-- Receipts policies
CREATE POLICY "Users can view their SME's receipts"
    ON receipts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN sales s ON s.sme_id = p.sme_id
            WHERE p.id = auth.uid()
            AND s.id = receipts.sale_id
        )
    );

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user_registration()
RETURNS TRIGGER AS $$
DECLARE
    _sme_id UUID;
BEGIN
    -- If user is a boss, create SME details first
    IF NEW.raw_user_meta_data->>'role' = 'boss' THEN
        INSERT INTO sme_details (business_name, owner_id)
        VALUES (
            NEW.raw_user_meta_data->>'sme_name',
            NEW.id
        )
        RETURNING id INTO _sme_id;
    ELSE
        -- For associates, get SME ID from boss
        SELECT sme_id INTO _sme_id
        FROM profiles
        WHERE id = (NEW.raw_user_meta_data->>'boss_id')::UUID;
    END IF;

    -- Create profile
    INSERT INTO profiles (
        id,
        email,
        full_name,
        role,
        boss_id,
        sme_id
    ) VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'role',
        CASE 
            WHEN NEW.raw_user_meta_data->>'role' = 'boss' THEN NEW.id
            ELSE (NEW.raw_user_meta_data->>'boss_id')::UUID
        END,
        _sme_id
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user_registration();
