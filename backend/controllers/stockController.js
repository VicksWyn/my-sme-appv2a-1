const supabase = require('../lib/supabase');

const stockController = {
    // Get all stock items
    getAllItems: async (req, res) => {
        try {
            const { data, error } = await supabase
                .from('stock_items')
                .select('*')
                .order('name');

            if (error) throw error;
            res.json(data);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Get a single stock item
    getItem: async (req, res) => {
        try {
            const { id } = req.params;
            const { data, error } = await supabase
                .from('stock_items')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (!data) {
                return res.status(404).json({ message: 'Stock item not found' });
            }
            res.json(data);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Create a new stock item
    createItem: async (req, res) => {
        try {
            const { 
                name, 
                description, 
                quantity, 
                unit_price,
                cost_price,
                reorder_level,
                unit_of_measure,
                custom_unit,
                sme_id 
            } = req.body;
            
            const { data, error } = await supabase
                .from('stock_items')
                .insert([{
                    name,
                    description,
                    quantity,
                    unit_price,
                    cost_price,
                    reorder_level,
                    unit_of_measure,
                    custom_unit,
                    sme_id
                }])
                .select()
                .single();

            if (error) throw error;
            res.status(201).json(data);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Update a stock item
    updateItem: async (req, res) => {
        try {
            const { id } = req.params;
            const { 
                name, 
                description, 
                quantity, 
                unit_price,
                cost_price,
                reorder_level,
                unit_of_measure,
                custom_unit 
            } = req.body;

            const { data, error } = await supabase
                .from('stock_items')
                .update({
                    name,
                    description,
                    quantity,
                    unit_price,
                    cost_price,
                    reorder_level,
                    unit_of_measure,
                    custom_unit
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            if (!data) {
                return res.status(404).json({ message: 'Stock item not found' });
            }
            res.json(data);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Delete a stock item
    deleteItem: async (req, res) => {
        try {
            const { id } = req.params;
            const { error } = await supabase
                .from('stock_items')
                .delete()
                .eq('id', id);

            if (error) throw error;
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};

module.exports = stockController;
