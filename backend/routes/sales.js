const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
    getAllSales,
    getSale,
    createSale,
    updateSale,
    deleteSale
} = require('../controllers/salesController');

// Get all sales
router.get('/', authenticateToken, getAllSales);

// Get a single sale
router.get('/:id', authenticateToken, getSale);

// Create a new sale
router.post('/', authenticateToken, createSale);

// Update a sale
router.put('/:id', authenticateToken, updateSale);

// Delete a sale
router.delete('/:id', authenticateToken, deleteSale);

module.exports = router;