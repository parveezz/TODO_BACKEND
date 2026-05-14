const User = require('../models/User');
const Task = require('../models/Task');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

// @desc    Register user
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const user = await User.create({ name, email, password });

    // Send Welcome Email
    try {
      await sendEmail({
        email: user.email,
        subject: 'Welcome to TodoApp!',
        message: `Hi ${user.name}, welcome to the most efficient Todo app. Start organizing your life today!`
      });
    } catch (err) {
      console.error('Email could not be sent', err);
    }

    sendTokenResponse(user, 201, res);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Google Login
// @route   POST /api/auth/google
exports.googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ success: false, message: 'ID Token is required' });
    }

    // Verify token with Google
    const googleResponse = await new Promise((resolve, reject) => {
      https.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => { resolve(JSON.parse(data)); });
      }).on('error', (err) => { reject(err); });
    });

    if (googleResponse.error || !googleResponse.email) {
      return res.status(400).json({ success: false, message: 'Invalid Google token' });
    }

    const { email, name, picture } = googleResponse;

    // Find or create user
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user for Google login
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        password: crypto.randomBytes(16).toString('hex'), // Random password for Google users
        profileImage: picture || ''
      });

      // Send Welcome Email
      try {
        await sendEmail({
          email: user.email,
          subject: 'Welcome to TodoApp!',
          message: `Hi ${user.name}, welcome to TodoApp! You've successfully signed up with Google.`
        });
      } catch (err) {
        console.error('Email error:', err);
      }
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.error('Google Login Error:', err);
    res.status(500).json({ success: false, message: 'Google authentication failed' });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({ success: true, data: user });
};

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
exports.updateDetails = async (req, res) => {
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email
  };

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  res.status(200).json({ success: true, data: user });
};

// @desc    Update user settings
// @route   PUT /api/auth/settings
exports.updateSettings = async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { settings: req.body },
    { new: true, runValidators: true }
  );

  res.status(200).json({ success: true, data: user.settings });
};

// @desc    Delete user account
// @route   DELETE /api/auth/deleteaccount
exports.deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Delete profile image if exists
    if (user.profileImage && user.profileImage.startsWith('/uploads')) {
      const imagePath = path.join(__dirname, '..', user.profileImage);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Delete all tasks associated with the user
    const userTasks = await Task.find({ user: req.user.id });
    for (const task of userTasks) {
      if (task.image) {
        const taskImagePath = path.join(__dirname, '..', task.image);
        if (fs.existsSync(taskImagePath)) {
          fs.unlinkSync(taskImagePath);
        }
      }
      await task.deleteOne();
    }

    await user.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Helper to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
      settings: user.settings
    }
  });
};
