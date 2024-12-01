require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const salesRoutes = require('./routes/sales');
const stockRoutes = require('./routes/stock');
const receiptRoutes = require('./routes/receipts');

const app = express();
const PORT = process.env.PORT || 5000;

// Configure CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/receipts', receiptRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: err.message || 'Something went wrong!',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Environment variables loaded:', {
    SUPABASE_URL: process.env.SUPABASE_URL ? '✓' : '✗',
    INFOBIP_API_KEY: process.env.INFOBIP_API_KEY ? '✓' : '✗',
    INFOBIP_BASE_URL: process.env.INFOBIP_BASE_URL ? '✓' : '✗',
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000'
  });
});