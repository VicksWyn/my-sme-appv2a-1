const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
    getAllItems,
    getItem,
    createItem,
    updateItem,
    deleteItem
} = require('../controllers/stockController');

// Get all stock items
router.get('/', authenticateToken, getAllItems);

// Get a single stock item
router.get('/:id', authenticateToken, getItem);

// Create a new stock item
router.post('/', authenticateToken, createItem);

// Update a stock item
router.put('/:id', authenticateToken, updateItem);

// Delete a stock item
router.delete('/:id', authenticateToken, deleteItem);

module.exports = router;