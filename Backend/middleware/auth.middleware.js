const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('./asyncHandler');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Read token from HttpOnly Cookie
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // 2. Fallback: Read token from Authorization Header (Bearer token)
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Check if token exists
  if (!token) {
    throw new ApiError(401, 'Not authorized, please login to continue');
  }

  try {
    // Verify JWT token
    const decoded = jwt.verify(token, env.JWT_SECRET || 'nv-chatbot-jwt-secret-key-321-def-987-xyz-654-abc');

    // Fetch user and exclude password field
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      throw new ApiError(401, 'User associated with this token no longer exists');
    }

    // Attach user payload to request
    req.user = user;
    next();
  } catch (error) {
    console.error('JWT Verification Error:', error.message);
    throw new ApiError(401, 'Token verification failed, not authorized');
  }
});

module.exports = { protect };
