import supabase from '../lib/supabase';

export const stockService = {
    // Create new stock item
    async createStockItem(stockItem) {
        const { data, error } = await supabase
            .from('stock_items')
            .insert([stockItem])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Check if stock item exists
    async checkExistingStock(smeId, itemName) {
        const { data, error } = await supabase
            .from('stock_items')
            .select('id, name, quantity, unit_price, cost_price, reorder_level')
            .eq('sme_id', smeId)
            .eq('name', itemName)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },

    // Update stock quantity and prices
    async updateStock(itemId, smeId, { quantity, unitPrice, costPrice }) {
        const { data, error } = await supabase
            .from('stock_items')
            .update({
                quantity: supabase.raw(`quantity + ${quantity}`),
                unit_price: unitPrice || undefined,
                cost_price: costPrice || undefined,
                updated_at: new Date()
            })
            .eq('id', itemId)
            .eq('sme_id', smeId)
            .select();

        if (error) throw error;
        return data;
    },

    // Reduce stock for sales
    async reduceStock(itemId, smeId, quantity) {
        const { data, error } = await supabase
            .from('stock_items')
            .update({
                quantity: supabase.raw(`GREATEST(quantity - ${quantity}, 0)`),
                updated_at: new Date()
            })
            .eq('id', itemId)
            .eq('sme_id', smeId)
            .gt('quantity', quantity - 1)
            .select();

        if (error) throw error;
        return data;
    },

    // Get low stock alerts
    async getLowStockAlerts(smeId) {
        const { data, error } = await supabase
            .from('stock_items')
            .select('name, quantity, reorder_level, unit_price, unit_of_measure')
            .eq('sme_id', smeId)
            .lte('quantity', supabase.raw('reorder_level'))
            .order('quantity');

        if (error) throw error;
        return data;
    },

    // Get stock value report
    async getStockValueReport(smeId) {
        const { data, error } = await supabase
            .from('stock_items')
            .select('name, quantity, unit_price, cost_price')
            .eq('sme_id', smeId)
            .order('quantity', { ascending: false });

        if (error) throw error;
        return data.map(item => ({
            ...item,
            retail_value: item.quantity * item.unit_price,
            cost_value: item.quantity * item.cost_price,
            potential_profit: (item.quantity * item.unit_price) - (item.quantity * item.cost_price)
        }));
    },

    // Get stock movement history
    async getStockMovementHistory(smeId, days = 30) {
        const { data, error } = await supabase
            .from('sales')
            .select(`
                created_at,
                sales_items (
                    quantity,
                    unit_price,
                    stock_items (
                        name
                    )
                )
            `)
            .eq('sme_id', smeId)
            .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    // Get stock audit report
    async getStockAudit(smeId) {
        const { data, error } = await supabase
            .rpc('get_stock_audit', { p_sme_id: smeId });

        if (error) throw error;
        return data;
    },

    // Check for duplicate items
    async checkDuplicates(smeId) {
        const { data, error } = await supabase
            .from('stock_items')
            .select('name, id')
            .eq('sme_id', smeId);

        if (error) throw error;

        const duplicates = data.reduce((acc, item) => {
            acc[item.name] = acc[item.name] || [];
            acc[item.name].push(item.id);
            return acc;
        }, {});

        return Object.entries(duplicates)
            .filter(([_, ids]) => ids.length > 1)
            .map(([name, ids]) => ({ name, ids }));
    },

    // Get detailed item information
    async getStockItemDetails(itemId, smeId) {
        const { data, error } = await supabase
            .from('stock_items')
            .select(`
                *,
                sales_items (
                    quantity,
                    unit_price,
                    sales (
                        created_at
                    )
                )
            `)
            .eq('id', itemId)
            .eq('sme_id', smeId)
            .single();

        if (error) throw error;
        
        const salesData = data.sales_items || [];
        return {
            ...data,
            times_sold: salesData.length,
            total_units_sold: salesData.reduce((sum, sale) => sum + sale.quantity, 0),
            total_revenue: salesData.reduce((sum, sale) => sum + (sale.quantity * sale.unit_price), 0)
        };
    }
};
