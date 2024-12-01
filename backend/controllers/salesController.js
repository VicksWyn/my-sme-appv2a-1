const supabase = require('../lib/supabase');

const salesController = {
    // Get all sales
    getAllSales: async (req, res) => {
        try {
            const { data, error } = await supabase
                .from('sales')
                .select(`
                    *,
                    sales_items (
                        *,
                        stock_items (
                            name,
                            unit_price
                        )
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            res.json(data);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Get a single sale
    getSale: async (req, res) => {
        try {
            const { id } = req.params;
            const { data, error } = await supabase
                .from('sales')
                .select(`
                    *,
                    sales_items (
                        *,
                        stock_items (
                            name,
                            unit_price
                        )
                    )
                `)
                .eq('id', id)
                .single();

            if (error) throw error;
            if (!data) {
                return res.status(404).json({ message: 'Sale not found' });
            }
            res.json(data);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Create a new sale
    createSale: async (req, res) => {
        try {
            const { items, total, payment_method, customer_name } = req.body;
            
            // Insert sale record
            const { data: sale, error: saleError } = await supabase
                .from('sales')
                .insert([{
                    total,
                    payment_method,
                    customer_name,
                    user_id: req.user.id
                }])
                .select()
                .single();

            if (saleError) throw saleError;

            // Insert sale items
            const salesItems = items.map(item => ({
                sale_id: sale.id,
                stock_item_id: item.stock_item_id,
                quantity: item.quantity,
                unit_price: item.unit_price
            }));

            const { error: itemsError } = await supabase
                .from('sales_items')
                .insert(salesItems);

            if (itemsError) throw itemsError;

            res.status(201).json(sale);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Update a sale
    updateSale: async (req, res) => {
        try {
            const { id } = req.params;
            const updates = req.body;

            const { data, error } = await supabase
                .from('sales')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            res.json(data);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Delete a sale
    deleteSale: async (req, res) => {
        try {
            const { id } = req.params;
            
            // Delete associated sales items first
            await supabase
                .from('sales_items')
                .delete()
                .eq('sale_id', id);

            // Delete the sale
            const { error } = await supabase
                .from('sales')
                .delete()
                .eq('id', id);

            if (error) throw error;
            res.json({ message: 'Sale deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};

module.exports = salesController;
