-- Check if sales table exists and its structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sales';
