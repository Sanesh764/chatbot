const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');

/**
 * Check if the database connection is alive and active.
 */
const isDbConnected = () => {
  return mongoose.connection && mongoose.connection.readyState === 1;
};

/**
 * Ensures MongoDB is connected, throwing an error if it isn't.
 */
const ensureDbConnection = () => {
  if (!isDbConnected()) {
    throw new Error('Database connection is not active');
  }
};

/**
 * Get or create a conversation session.
 */
const getOrCreateSession = async (sessionId, userId, title = 'New Conversation') => {
  ensureDbConnection();
  
  let conversation = await Conversation.findOne({ sessionId });
  
  if (!conversation) {
    conversation = new Conversation({
      sessionId,
      userId,
      title: title || 'New Conversation',
      messages: []
    });
    await conversation.save();
  }
  
  return conversation;
};

/**
 * Fetch chat history for a session.
 */
const getChatHistory = async (sessionId) => {
  ensureDbConnection();
  
  const conversation = await Conversation.findOne({ sessionId });
  return conversation ? conversation.messages : [];
};

/**
 * Save a single message to a session.
 */
const saveMessage = async (sessionId, userId, role, content) => {
  ensureDbConnection();
  
  // Normalize roles: frontend might send 'ai', Gemini expects 'model'
  const normalizedRole = role === 'ai' ? 'model' : role;

  let conversation = await Conversation.findOne({ sessionId });
  
  if (!conversation) {
    // If conversation doesn't exist, create it
    conversation = new Conversation({
      sessionId,
      userId,
      title: content.substring(0, 30) + (content.length > 30 ? '...' : ''),
      messages: []
    });
  }

  conversation.messages.push({
    role: normalizedRole,
    content,
    timestamp: new Date()
  });

  await conversation.save();
  return conversation;
};

/**
 * Clear/delete a chat session history.
 */
const clearChatHistory = async (sessionId) => {
  ensureDbConnection();
  
  // Either clear messages array or delete conversation fully. 
  // Let's delete the conversation so we don't leak empty documents.
  const result = await Conversation.deleteOne({ sessionId });
  return result.deletedCount > 0;
};

/**
 * Get all sessions for a specific user.
 */
const getSessionsByUser = async (userId) => {
  ensureDbConnection();
  
  return await Conversation.find({ userId })
    .select('sessionId userId title createdAt updatedAt')
    .sort({ updatedAt: -1 });
};

module.exports = {
  isDbConnected,
  getOrCreateSession,
  getChatHistory,
  saveMessage,
  clearChatHistory,
  getSessionsByUser
};
