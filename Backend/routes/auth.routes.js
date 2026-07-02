const express = require('express');
const router = express.Router();
const multer = require('multer');
const authController = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const asyncHandler = require('../middleware/asyncHandler');

// Configure Multer storage to parse images in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// SignUp Route (Optional Avatar Upload)
router.post('/signup', upload.single('avatar'), asyncHandler(authController.signup));

// LogIn Route
router.post('/login', asyncHandler(authController.login));

// LogOut Route
router.post('/logout', asyncHandler(authController.logout));

// Get User Profile Route (Protected)
router.get('/profile', protect, asyncHandler(authController.profile));

// Update User Profile Route (Protected Avatar Upload)
router.put('/profile', protect, upload.single('avatar'), asyncHandler(authController.updateProfile));

// Check Auth Status Route (Protected)
router.get('/check-auth', protect, asyncHandler(authController.checkAuth));

module.exports = router;
