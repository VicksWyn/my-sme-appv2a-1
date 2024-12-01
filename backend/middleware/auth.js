const jwt = require('jsonwebtoken');
const supabase = require('../lib/supabase');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const auth = {
  // Verify JWT token
  verifyToken: async (req, res, next) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ message: 'Token is invalid' });
    }
  },

  // Authenticate token using Supabase
  authenticateToken: async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' });
      }

      const token = authHeader.replace('Bearer ', '');
      
      // Verify the token with Supabase
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        console.error('Token verification error:', error);
        return res.status(401).json({ message: 'Invalid session' });
      }

      // Add user data to request
      req.user = user;
      next();
    } catch (error) {
      console.error('Auth error:', error);
      res.status(401).json({ message: 'Authentication failed' });
    }
  },

  // Check if user is Boss
  isBoss: async (req, res, next) => {
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', req.user.id)
        .single();

      if (error || !profile) {
        return res.status(403).json({ message: 'Profile not found' });
      }

      if (profile.role !== 'Boss') {
        return res.status(403).json({ message: 'Access denied: Boss role required' });
      }

      next();
    } catch (error) {
      res.status(500).json({ message: 'Error checking role' });
    }
  },

  // Check if user is Associate
  isAssociate: async (req, res, next) => {
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', req.user.id)
        .single();

      if (error || !profile) {
        return res.status(403).json({ message: 'Profile not found' });
      }

      if (profile.role !== 'Associate') {
        return res.status(403).json({ message: 'Access denied: Associate role required' });
      }

      next();
    } catch (error) {
      res.status(500).json({ message: 'Error checking role' });
    }
  },

  // Check if user belongs to specific SME
  belongsToSME: async (req, res, next) => {
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('sme_id')
        .eq('user_id', req.user.id)
        .single();

      if (error || !profile) {
        return res.status(403).json({ message: 'Profile not found' });
      }

      req.smeId = profile.sme_id;
      next();
    } catch (error) {
      res.status(500).json({ message: 'Error checking SME' });
    }
  }
};

module.exports = auth;
