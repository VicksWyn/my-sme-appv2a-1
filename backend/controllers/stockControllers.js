<<<<<<< HEAD
const stockController = {
    getAllStock: async (req, res) => {
      try {
        // Add database logic here
        res.json({ message: 'Get all stock' });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }  },

      createStock: async (req, res) => {
        try {
          const { product, quantity } = req.body;
          // Add database logic here
          res.status(201).json({ message: 'Stock created', data: { product, quantity } });
        } catch (error) {
          res.status(500).json({ error: error.message });
        }
      },
    
      getStockById: async (req, res) => {
        try {
          const { id } = req.params;
          // Add database logic here
          res.json({ message: `Get stock ${id}` });
        } catch (error) {
          res.status(500).json({ error: error.message });
        }
      },
    
      updateStock: async (req, res) => {
        try {
          const { id } = req.params;
          // Add database logic here
          res.json({ message: `Update stock ${id}` });
        } catch (error) {
          res.status(500).json({ error: error.message });
        }
      },
    
      deleteStock: async (req, res) => {
        try {
          const { id } = req.params;
          // Add database logic here
          res.json({ message: `Delete stock ${id}` });
        } catch (error) {
          res.status(500).json({ error: error.message });
        }
      },
    };
    
=======
const stockController = {
    getAllStock: async (req, res) => {
      try {
        // Add database logic here
        res.json({ message: 'Get all stock' });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }  },

      createStock: async (req, res) => {
        try {
          const { product, quantity } = req.body;
          // Add database logic here
          res.status(201).json({ message: 'Stock created', data: { product, quantity } });
        } catch (error) {
          res.status(500).json({ error: error.message });
        }
      },
    
      getStockById: async (req, res) => {
        try {
          const { id } = req.params;
          // Add database logic here
          res.json({ message: `Get stock ${id}` });
        } catch (error) {
          res.status(500).json({ error: error.message });
        }
      },
    
      updateStock: async (req, res) => {
        try {
          const { id } = req.params;
          // Add database logic here
          res.json({ message: `Update stock ${id}` });
        } catch (error) {
          res.status(500).json({ error: error.message });
        }
      },
    
      deleteStock: async (req, res) => {
        try {
          const { id } = req.params;
          // Add database logic here
          res.json({ message: `Delete stock ${id}` });
        } catch (error) {
          res.status(500).json({ error: error.message });
        }
      },
    };
    
>>>>>>> e3c1bc6 (fast commit)
    module.exports = stockController;