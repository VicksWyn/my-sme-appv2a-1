-- Step 1: Create necessary types
DO $$ BEGIN
    CREATE TYPE unit_of_measure_type AS ENUM (
        'piece', 'kg', 'g', 'mg', 'l', 'm', 'cm', 'mm', 'sqm', 'cbm', 'dozen', 'box', 'pack', 'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.sales_items;
DROP TABLE IF EXISTS public.sales;
DROP TABLE IF EXISTS public.stock_items;
DROP TABLE IF EXISTS public.notifications;
DROP TABLE IF EXISTS public.sme_details;
DROP TABLE IF EXISTS public.profiles;

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    email TEXT,
    role TEXT CHECK (role IN ('boss', 'associate')),
    boss_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create profiles policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Create SME details table
CREATE TABLE IF NOT EXISTS public.sme_details (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    owner_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    business_name TEXT NOT NULL,
    business_type TEXT CHECK (business_type IN ('retail', 'wholesale', 'service', 'manufacturing')),
    status TEXT CHECK (status IN ('active', 'inactive', 'suspended')) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(owner_id)
);

-- Enable RLS for SME details
ALTER TABLE public.sme_details ENABLE ROW LEVEL SECURITY;

-- Create SME details policies
DROP POLICY IF EXISTS "SME details are viewable by owner and associates" ON public.sme_details;
DROP POLICY IF EXISTS "SME details can be inserted by owner" ON public.sme_details;
DROP POLICY IF EXISTS "SME details can be updated by owner" ON public.sme_details;

CREATE POLICY "SME details are viewable by owner and associates"
ON public.sme_details FOR SELECT
TO authenticated
USING (
    owner_id = auth.uid() OR  -- Owner can view
    EXISTS (  -- Associates can view their boss's SME details
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND boss_id = owner_id
    )
);

CREATE POLICY "SME details can be inserted by owner"
ON public.sme_details FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "SME details can be updated by owner"
ON public.sme_details FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Create notifications table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create stock items table
CREATE TABLE public.stock_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sme_id UUID NOT NULL REFERENCES public.sme_details(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    quantity INTEGER NOT NULL DEFAULT 0,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sales table
CREATE TABLE public.sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sme_id UUID NOT NULL REFERENCES public.sme_details(id) ON DELETE CASCADE,
    total_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sales items table
CREATE TABLE public.sales_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    stock_item_id UUID NOT NULL REFERENCES public.stock_items(id),
    quantity INTEGER NOT NULL,
    price_at_sale DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create function to automatically set updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_sme_details ON public.sme_details;
CREATE TRIGGER set_updated_at_sme_details
    BEFORE UPDATE ON public.sme_details
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_stock_items ON public.stock_items;
CREATE TRIGGER set_updated_at_stock_items
    BEFORE UPDATE ON public.stock_items
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_sales ON public.sales;
CREATE TRIGGER set_updated_at_sales
    BEFORE UPDATE ON public.sales
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_sales_items ON public.sales_items;
CREATE TRIGGER set_updated_at_sales_items
    BEFORE UPDATE ON public.sales_items
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_boss_id ON public.profiles(boss_id);
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_sme_details_owner_id ON public.sme_details(owner_id);
CREATE INDEX IF NOT EXISTS idx_stock_items_sme_id ON public.stock_items(sme_id);
CREATE INDEX IF NOT EXISTS idx_sales_sme_id ON public.sales(sme_id);
CREATE INDEX IF NOT EXISTS idx_sales_items_sale_id ON public.sales_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sales_items_stock_item_id ON public.sales_items(stock_item_id);

-- Step 11: Create profile creation trigger
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS TRIGGER AS $$
DECLARE
    v_business_name text;
BEGIN
    -- Extract business_name from metadata
    v_business_name := NEW.raw_user_meta_data->>'business_name';

    -- Create profile
    INSERT INTO public.profiles (
        id,
        full_name,
        email,
        role
    ) VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'username',
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'associate')
    );

    -- If role is 'boss' and business_name is provided, create SME details
    IF COALESCE(NEW.raw_user_meta_data->>'role', 'associate') = 'boss' AND v_business_name IS NOT NULL THEN
        INSERT INTO public.sme_details (
            owner_id,
            business_name
        ) VALUES (
            NEW.id,
            v_business_name
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_created();

-- Add function to update user profile
CREATE OR REPLACE FUNCTION public.update_user_profile(
    p_user_id UUID,
    p_full_name TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL,
    p_business_name TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_role TEXT;
    v_sme_id UUID;
BEGIN
    -- Get user's role
    SELECT role INTO v_role
    FROM public.profiles
    WHERE id = p_user_id;

    -- Update profile
    UPDATE public.profiles
    SET
        full_name = COALESCE(p_full_name, full_name),
        email = COALESCE(p_email, email),
        updated_at = NOW()
    WHERE id = p_user_id;

    -- If user is a boss and business_name is provided, update SME details
    IF v_role = 'boss' AND p_business_name IS NOT NULL THEN
        UPDATE public.sme_details
        SET
            business_name = p_business_name,
            updated_at = NOW()
        WHERE owner_id = p_user_id;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 12: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
