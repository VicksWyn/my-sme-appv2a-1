const supabase = require('../lib/supabase');
const User = require('../models/User');

const authController = {
  // Register a new user
  register: async (req, res) => {
    try {
      const { email, password, name, smeName, role } = req.body;

      // Register user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      // Create user profile in users table
      const userData = {
        id: authData.user.id,
        email,
        name,
        smeName,
        role,
        created_at: new Date().toISOString(),
      };

      await User.create(userData);

      res.status(201).json({
        message: 'User registered successfully',
        user: userData
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: error.message });
    }
  },

  // Login user
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // Get user profile
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({
        user,
        session: authData.session
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(401).json({ message: 'Invalid credentials' });
    }
  },

  // Get user profile
  getProfile: async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Get associates (only for Boss role)
  getAssociates: async (req, res) => {
    try {
      const { data: associates, error } = await supabase
        .from('users')
        .select('*')
        .eq('bossId', req.user.id);

      if (error) throw error;

      res.json(associates);
      
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = authController;
