const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const prisma = require('../config/prisma');

// Register new user
const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { email, password, name, role, warehouseId } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || 'USER',
        warehouseId
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        warehouseId: true,
        createdAt: true
      }
    });

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { user, token }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    console.log('📝 Login attempt for email:', req.body.email);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;
    console.log('🔍 Looking up user...');

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    console.log('👤 User found:', user ? 'Yes' : 'No');

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    console.log('🔐 Checking password...');
    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('✅ Password valid:', isValidPassword);
    
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    console.log('🎫 Generating token...');
    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    console.log('✅ Login successful for:', email);
    
    res.json({
      success: true,
      message: 'Login successful',
      data: { user: userWithoutPassword, token }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    
    // Check for Prisma errors
    if (error.code) {
      console.error('❌ Prisma error code:', error.code);
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      // Only send details in development
      ...(process.env.NODE_ENV === 'development' && { 
        error: error.message,
        stack: error.stack 
      })
    });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        warehouseId: true,
        createdAt: true,
        warehouse: {
          select: {
            id: true,
            name: true,
            location: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

module.exports = {
  register,
  login,
  getProfile
};