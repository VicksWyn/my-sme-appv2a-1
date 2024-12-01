-- Create function to get policies for a table
CREATE OR REPLACE FUNCTION get_policies_for_table(table_name text)
RETURNS TABLE (
    policyname text,
    permissive text,
    roles name[],
    cmd text,
    qual text,
    with_check text
) SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.policyname::text,
        p.permissive::text,
        p.roles::name[],
        p.cmd::text,
        p.qual::text,
        p.with_check::text
    FROM pg_policies p
    WHERE p.tablename = table_name
    AND p.schemaname = 'public';
END;
$$ LANGUAGE plpgsql;
