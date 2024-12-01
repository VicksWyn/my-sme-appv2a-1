-- Function to get sme_id for a user
CREATE OR REPLACE FUNCTION get_sme_id(user_id UUID)
RETURNS UUID AS $$
DECLARE
    sme_id UUID;
BEGIN
    SELECT id INTO sme_id
    FROM public.sme_details
    WHERE owner_id = user_id;
    RETURN sme_id;
END;
$$ LANGUAGE plpgsql;

-- Insert sample stock items
DO $$ 
DECLARE
    v_sme_id UUID;
    v_stock_id1 UUID;
    v_stock_id2 UUID;
    v_stock_id3 UUID;
BEGIN
    -- Get the SME ID for the first boss user we find
    SELECT id INTO v_sme_id
    FROM public.sme_details
    LIMIT 1;

    IF v_sme_id IS NOT NULL THEN
        -- Insert stock items
        INSERT INTO public.stock (sme_id, name, description, quantity, price, reorder_level)
        VALUES 
            (v_sme_id, 'Laptop', 'High-performance laptop', 15, 999.99, 5)
        RETURNING id INTO v_stock_id1;

        INSERT INTO public.stock (sme_id, name, description, quantity, price, reorder_level)
        VALUES 
            (v_sme_id, 'Smartphone', 'Latest model smartphone', 25, 699.99, 8)
        RETURNING id INTO v_stock_id2;

        INSERT INTO public.stock (sme_id, name, description, quantity, price, reorder_level)
        VALUES 
            (v_sme_id, 'Tablet', 'Professional tablet with stylus', 10, 549.99, 4)
        RETURNING id INTO v_stock_id3;

        -- Insert sample customers
        INSERT INTO public.customers (sme_id, name, email, phone, address)
        VALUES
            (v_sme_id, 'John Doe', 'john@example.com', '+1234567890', '123 Main St'),
            (v_sme_id, 'Jane Smith', 'jane@example.com', '+1987654321', '456 Oak Ave'),
            (v_sme_id, 'Bob Johnson', 'bob@example.com', '+1122334455', '789 Pine Rd');

        -- Insert sample sales (last 60 days)
        INSERT INTO public.sales (sme_id, stock_id, quantity, amount, created_at)
        VALUES
            -- Recent sales (last 30 days)
            (v_sme_id, v_stock_id1, 2, 1999.98, NOW() - INTERVAL '1 day'),
            (v_sme_id, v_stock_id2, 3, 2099.97, NOW() - INTERVAL '3 days'),
            (v_sme_id, v_stock_id3, 1, 549.99, NOW() - INTERVAL '5 days'),
            (v_sme_id, v_stock_id1, 1, 999.99, NOW() - INTERVAL '8 days'),
            (v_sme_id, v_stock_id2, 2, 1399.98, NOW() - INTERVAL '15 days'),
            (v_sme_id, v_stock_id3, 3, 1649.97, NOW() - INTERVAL '20 days'),
            (v_sme_id, v_stock_id1, 1, 999.99, NOW() - INTERVAL '25 days'),
            
            -- Older sales (30-60 days ago)
            (v_sme_id, v_stock_id2, 1, 699.99, NOW() - INTERVAL '35 days'),
            (v_sme_id, v_stock_id3, 2, 1099.98, NOW() - INTERVAL '40 days'),
            (v_sme_id, v_stock_id1, 1, 999.99, NOW() - INTERVAL '45 days'),
            (v_sme_id, v_stock_id2, 1, 699.99, NOW() - INTERVAL '50 days'),
            (v_sme_id, v_stock_id3, 1, 549.99, NOW() - INTERVAL '55 days');

        -- Update stock quantities to reflect sales
        UPDATE public.stock
        SET quantity = quantity - (
            SELECT COALESCE(SUM(quantity), 0)
            FROM public.sales
            WHERE stock_id = stock.id
        )
        WHERE sme_id = v_sme_id;

    END IF;
END $$;
