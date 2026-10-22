const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/authMiddleware');

// User Registration (Only registers regular farmers/users)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'Name, email and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({
        message: 'User already exists'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Enforce role 'farmer' for all public registrations
    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: 'farmer'
    });

    await user.save();

    res.status(201).json({
      message: 'User registered successfully. Please proceed to login.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        message: 'User already exists'
      });
    }

    console.error('Registration error:', err.message);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// User / Farmer Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    // Portal Separation: Administrator accounts must use the dedicated Admin Portal
    if (user.role === 'admin') {
      return res.status(403).json({
        message: 'This account has administrator privileges. Please sign in via the Admin Portal at /admin/login.'
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is missing from .env');
      return res.status(500).json({
        message: 'Server configuration error'
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Admin Login (Strictly verifies admin role)
router.post('/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Admin email and password are required'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        message: 'Invalid administrative credentials'
      });
    }

    // Server-side role check
    if (user.role !== 'admin') {
      return res.status(403).json({
        message: 'Access denied: This account does not possess administrator privileges'
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        message: 'Server configuration error'
      });
    }

    const token = jwt.sign(
      { id: user._id, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Admin authentication successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: 'admin'
      }
    });
  } catch (err) {
    console.error('Admin login error:', err.message);
    res.status(500).json({ message: 'Server error during admin login' });
  }
});

// Verify Current User / Session Check
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to verify session' });
  }
});

module.exports = router;
