-- Create stock table
CREATE TABLE IF NOT EXISTS public.stock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sme_id UUID REFERENCES public.sme_details(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity INTEGER NOT NULL DEFAULT 0,
    price DECIMAL(10,2) NOT NULL,
    reorder_level INTEGER NOT NULL DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create sales table
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sme_id UUID REFERENCES public.sme_details(id) ON DELETE CASCADE,
    stock_id UUID REFERENCES public.stock(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create customers table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sme_id UUID REFERENCES public.sme_details(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Add RLS policies
ALTER TABLE public.stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Stock policies
CREATE POLICY "Users can view their own stock"
    ON public.stock FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.sme_details sd
        WHERE sd.id = stock.sme_id
        AND sd.owner_id = auth.uid()
    ));

CREATE POLICY "Users can insert their own stock"
    ON public.stock FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.sme_details sd
        WHERE sd.id = stock.sme_id
        AND sd.owner_id = auth.uid()
    ));

CREATE POLICY "Users can update their own stock"
    ON public.stock FOR UPDATE
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.sme_details sd
        WHERE sd.id = stock.sme_id
        AND sd.owner_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.sme_details sd
        WHERE sd.id = stock.sme_id
        AND sd.owner_id = auth.uid()
    ));

CREATE POLICY "Users can delete their own stock"
    ON public.stock FOR DELETE
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.sme_details sd
        WHERE sd.id = stock.sme_id
        AND sd.owner_id = auth.uid()
    ));

-- Sales policies
CREATE POLICY "Users can view their own sales"
    ON public.sales FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.sme_details sd
        WHERE sd.id = sales.sme_id
        AND sd.owner_id = auth.uid()
    ));

CREATE POLICY "Users can insert their own sales"
    ON public.sales FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.sme_details sd
        WHERE sd.id = sales.sme_id
        AND sd.owner_id = auth.uid()
    ));

CREATE POLICY "Users can update their own sales"
    ON public.sales FOR UPDATE
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.sme_details sd
        WHERE sd.id = sales.sme_id
        AND sd.owner_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.sme_details sd
        WHERE sd.id = sales.sme_id
        AND sd.owner_id = auth.uid()
    ));

CREATE POLICY "Users can delete their own sales"
    ON public.sales FOR DELETE
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.sme_details sd
        WHERE sd.id = sales.sme_id
        AND sd.owner_id = auth.uid()
    ));

-- Customers policies
CREATE POLICY "Users can view their own customers"
    ON public.customers FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.sme_details sd
        WHERE sd.id = customers.sme_id
        AND sd.owner_id = auth.uid()
    ));

CREATE POLICY "Users can insert their own customers"
    ON public.customers FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.sme_details sd
        WHERE sd.id = customers.sme_id
        AND sd.owner_id = auth.uid()
    ));

CREATE POLICY "Users can update their own customers"
    ON public.customers FOR UPDATE
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.sme_details sd
        WHERE sd.id = customers.sme_id
        AND sd.owner_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.sme_details sd
        WHERE sd.id = customers.sme_id
        AND sd.owner_id = auth.uid()
    ));

CREATE POLICY "Users can delete their own customers"
    ON public.customers FOR DELETE
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.sme_details sd
        WHERE sd.id = customers.sme_id
        AND sd.owner_id = auth.uid()
    ));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stock_sme_id ON public.stock(sme_id);
CREATE INDEX IF NOT EXISTS idx_sales_sme_id ON public.sales(sme_id);
CREATE INDEX IF NOT EXISTS idx_customers_sme_id ON public.customers(sme_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON public.sales(created_at DESC);
