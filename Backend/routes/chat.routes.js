const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const asyncHandler = require('../middleware/asyncHandler');

// Get all chat sessions for a user
router.get('/sessions', asyncHandler(chatController.getSessions));

// Create or retrieve a chat session
router.post('/sessions', asyncHandler(chatController.createSession));

// Get history for a session
router.get('/sessions/:sessionId/history', asyncHandler(chatController.getHistory));

// Clear history for a session
router.delete('/sessions/:sessionId', asyncHandler(chatController.clearHistory));

// Chat with history (MongoDB + Fallback hybrid)
router.post('/chat-with-history', asyncHandler(chatController.chatWithHistory));

// Test endpoint for connection status
router.get('/test', asyncHandler(chatController.getTest));

module.exports = router;
