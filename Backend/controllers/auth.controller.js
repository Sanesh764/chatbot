const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const env = require('../config/env');
const { uploadBuffer } = require('../config/cloudinary');

// Helper to generate JWT token and set cookie
const generateTokenAndSetCookie = (res, userId) => {
  const token = jwt.sign(
    { id: userId }, 
    env.JWT_SECRET || 'nv-chatbot-jwt-secret-key-321-def-987-xyz-654-abc', 
    { expiresIn: '30d' }
  );

  res.cookie('token', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  });

  return token;
};

/**
 * Register a new User
 */
const signup = async (req, res, next) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    throw new ApiError(400, 'All fields (username, email, password) are required');
  }

  if (username.trim().length < 3) {
    throw new ApiError(400, 'Username must be at least 3 characters long');
  }

  if (password.length < 6) {
    throw new ApiError(400, 'Password must be at least 6 characters long');
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, 'User with this email already exists');
  }

  // Handle optional profile picture upload to Cloudinary
  let avatarUrl = '';
  if (req.file) {
    try {
      const cloudinaryResult = await uploadBuffer(req.file.buffer);
      if (cloudinaryResult) {
        avatarUrl = cloudinaryResult.secure_url;
      }
    } catch (uploadError) {
      console.error('Signup avatar upload failed:', uploadError.message);
      // We don't crash signup if avatar upload fails, we just continue with empty avatar
    }
  }

  // Create new user in DB
  const user = await User.create({
    username: username.trim(),
    email: email.trim().toLowerCase(),
    password,
    avatar: avatarUrl
  });

  // Generate JWT and attach HttpOnly Cookie
  generateTokenAndSetCookie(res, user._id);

  // Return success profile response (exclude password)
  res.status(201).json(
    new ApiResponse(201, {
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      createdAt: user.createdAt
    }, 'User registered successfully')
  );
};

/**
 * Authenticate User & Log In
 */
const login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }

  // Fetch user from DB
  const user = await User.findOne({ email: email.trim().toLowerCase() });
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Compare passwords
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Generate JWT and attach HttpOnly Cookie
  generateTokenAndSetCookie(res, user._id);

  res.status(200).json(
    new ApiResponse(200, {
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      createdAt: user.createdAt
    }, 'Logged in successfully')
  );
};

/**
 * Log Out User
 */
const logout = async (req, res, next) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0)
  });

  res.status(200).json(
    new ApiResponse(200, {}, 'Logged out successfully')
  );
};

/**
 * Get current logged in user profile
 */
const profile = async (req, res, next) => {
  res.status(200).json(
    new ApiResponse(200, {
      _id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      avatar: req.user.avatar,
      createdAt: req.user.createdAt
    }, 'User profile retrieved successfully')
  );
};

/**
 * Check if user is authenticated (utility for frontend bootstrap load)
 */
const checkAuth = async (req, res, next) => {
  // If the flow reaches this handler, protect middleware has verified JWT successfully
  res.status(200).json(
    new ApiResponse(200, {
      _id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      avatar: req.user.avatar,
      createdAt: req.user.createdAt
    }, 'User is authenticated')
  );
};

/**
 * Update User Profile (username and/or avatar image upload)
 */
const updateProfile = async (req, res, next) => {
  const { username } = req.body;
  const user = req.user;

  if (username && username.trim().length >= 3) {
    user.username = username.trim();
  }

  // Handle avatar file upload if sent
  if (req.file) {
    const cloudinaryResult = await uploadBuffer(req.file.buffer);
    if (cloudinaryResult) {
      user.avatar = cloudinaryResult.secure_url;
    }
  }

  await user.save();

  res.status(200).json(
    new ApiResponse(200, {
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      createdAt: user.createdAt
    }, 'Profile updated successfully')
  );
};

module.exports = {
  signup,
  login,
  logout,
  profile,
  checkAuth,
  updateProfile
};
