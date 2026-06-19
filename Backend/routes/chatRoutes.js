const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// Get all chat sessions for a user
router.get('/sessions', chatController.getSessions);

// Create or retrieve a chat session
router.post('/sessions', chatController.createSession);

// Get history for a session
router.get('/sessions/:sessionId/history', chatController.getHistory);

// Clear history for a session
router.delete('/sessions/:sessionId', chatController.clearHistory);

// Chat with history (MongoDB + Fallback hybrid)
router.post('/chat-with-history', chatController.chatWithHistory);

module.exports = router;
