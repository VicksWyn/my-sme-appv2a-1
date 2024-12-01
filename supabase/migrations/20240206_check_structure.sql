-- Check if business_id exists in profiles
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles';

-- Check if business_id exists in stock_items
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'stock_items';
