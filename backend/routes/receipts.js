const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { sendReceiptViaSMS } = require('../controllers/receiptController');

// Send receipt via SMS
router.post('/send-sms', authenticateToken, sendReceiptViaSMS);

module.exports = router;
