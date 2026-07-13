const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, loginId: user.loginId, role: user.role },
    process.env.JWT_SECRET || 'secretkey',
    { expiresIn: '7d' }
  );
};

exports.register = async (req, res) => {
  try {
    console.log('Registration request received:', req.body); // Debug log
    
    const { loginId, password, name, role } = req.body;
    
    // Validation
    if (!loginId || !password || !name || !role) {
      return res.status(400).json({ 
        message: 'All fields are required: loginId, password, name, role' 
      });
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ loginId });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this login ID' });
    }
    
    // Create new user
    const user = new User({ 
      loginId, 
      password, 
      name, 
      role: role.toLowerCase() // Ensure role is lowercase
    });
    
    await user.save();
    console.log('User created successfully:', user._id); // Debug log
    
    // Generate token
    const token = generateToken(user);
    
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        loginId: user.loginId,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error); // Debug log
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { loginId, password } = req.body;
    
    const user = await User.findOne({ loginId });
    if (!user) {
      return res.status(401).json({ message: 'Invalid login credentials' });
    }
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid login credentials' });
    }
    
    const token = generateToken(user);
    
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        loginId: user.loginId,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};