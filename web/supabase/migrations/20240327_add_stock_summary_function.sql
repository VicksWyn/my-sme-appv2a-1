-- Create function to get stock status summary
CREATE OR REPLACE FUNCTION get_stock_status_summary(p_sme_id UUID)
RETURNS TABLE (
  total_items BIGINT,
  low_stock_items BIGINT,
  out_of_stock_items BIGINT,
  total_value DECIMAL
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_items,
    COUNT(CASE WHEN quantity <= reorder_level AND quantity > 0 THEN 1 END)::BIGINT as low_stock_items,
    COUNT(CASE WHEN quantity = 0 THEN 1 END)::BIGINT as out_of_stock_items,
    COALESCE(SUM(quantity * unit_price), 0)::DECIMAL as total_value
  FROM stock_items
  WHERE sme_id = p_sme_id;
END;
$$;
