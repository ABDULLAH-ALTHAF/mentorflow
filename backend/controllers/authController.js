const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { 
    expiresIn: '7d' 
  });
};

const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  console.log('📥 Registration attempt:', { name, email, role }); // ← Add this

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Please provide all fields' });
  }

  if (!['teacher', 'student'].includes(role)) {
    return res.status(400).json({ message: 'Role must be teacher or student' });
  }

  try {
    const userExists = await User.findOne({ email: email.toLowerCase().trim() });
    if (userExists) {
      console.log('⚠️ User already exists');
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    console.log('✅ Creating new user...');
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password,        // pre-save will hash it
      role
    });

    console.log('✅ User created successfully:', user._id);

    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token
    });
  } catch (error) {
    console.error('❌ Registration Error Details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      keyValue: error.keyValue
    });

    res.status(500).json({ 
      message: 'Server error during registration. Please try again.' 
    });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id, user.role);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Server error during login' });
  }
};

module.exports = { registerUser, loginUser };