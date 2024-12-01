-- Check all policies on profiles and stock_items
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('profiles', 'stock_items')
ORDER BY tablename, policyname;
