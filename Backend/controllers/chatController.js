const { GoogleGenerativeAI } = require('@google/generative-ai');
const chatService = require('../services/chatService');

// Initialize Gemini AI
let genAI;
let model;

const initGemini = () => {
  if (!genAI && process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }
  return model;
};

/**
 * Helper to generate fallback responses when Gemini is offline.
 */
function generateFallbackResponse(userMessage) {
  const responses = {
    'hello': 'Hi there! How can I help you today?',
    'hi': 'Hello! What can I do for you?',
    'how are you': 'I\'m doing well, thank you for asking! How can I assist you?',
    'bye': 'Goodbye! Have a great day!',
    'goodbye': 'Farewell! Feel free to come back anytime!',
    'help': 'I\'m here to help! What do you need assistance with?',
    'thanks': 'You\'re welcome! Is there anything else I can help you with?',
    'thank you': 'You\'re welcome! Is there anything else I can help you with?',
    'what can you do': 'I\'m an AI chatbot that can answer questions and assist with many topics!',
    'who are you': 'I\'m your friendly AI chatbot assistant!'
  };

  if (!userMessage) {
    return 'I didn\'t receive your message. Could you try again?';
  }

  const lowerMessage = userMessage.toLowerCase().trim();
  if (responses[lowerMessage]) return responses[lowerMessage];

  for (let key in responses) {
    if (lowerMessage.includes(key)) return responses[key];
  }

  return `I understand you said: "${userMessage}". I'm currently experiencing technical issues, but I'm here to help. Could you try rephrasing your question?`;
}

/**
 * Get all sessions for a user
 */
const getSessions = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId query parameter is required' });
    }

    if (!chatService.isDbConnected()) {
      return res.json({
        success: true,
        dbStatus: 'offline',
        sessions: [] // Return empty sessions array if DB is offline
      });
    }

    const sessions = await chatService.getSessionsByUser(userId);
    res.json({
      success: true,
      dbStatus: 'online',
      sessions
    });
  } catch (error) {
    console.error('Error fetching sessions:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Create a new chat session
 */
const createSession = async (req, res) => {
  try {
    const { sessionId, userId, title } = req.body;
    if (!sessionId || !userId) {
      return res.status(400).json({ success: false, error: 'sessionId and userId are required' });
    }

    if (!chatService.isDbConnected()) {
      return res.json({
        success: true,
        dbStatus: 'offline',
        message: 'Session created in memory (DB offline)',
        session: { sessionId, userId, title: title || 'New Conversation' }
      });
    }

    const session = await chatService.getOrCreateSession(sessionId, userId, title);
    res.json({
      success: true,
      dbStatus: 'online',
      session
    });
  } catch (error) {
    console.error('Error creating session:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get chat history for a session
 */
const getHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'sessionId parameter is required' });
    }

    if (!chatService.isDbConnected()) {
      return res.json({
        success: true,
        dbStatus: 'offline',
        messages: [] // Fall back to empty history if DB is offline
      });
    }

    const messages = await chatService.getChatHistory(sessionId);
    res.json({
      success: true,
      dbStatus: 'online',
      messages
    });
  } catch (error) {
    console.error('Error fetching history:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Clear chat history for a session
 */
const clearHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'sessionId parameter is required' });
    }

    if (!chatService.isDbConnected()) {
      return res.json({
        success: true,
        dbStatus: 'offline',
        message: 'Chat history cleared in memory (DB offline)'
      });
    }

    await chatService.clearChatHistory(sessionId);
    res.json({
      success: true,
      dbStatus: 'online',
      message: 'Chat history cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing history:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Send chat message and get AI response with history support (MongoDB/Fallback hybrid)
 */
const chatWithHistory = async (req, res) => {
  let useDb = false;
  const { messages, userId, sessionId } = req.body;
  try {
    // We expect either a messages array (fallback) or a single latest message
    // If sessionId is provided, we can fetch from DB or save.
    // If messages are passed in, the latest message is the last element.
    if ((!messages || !Array.isArray(messages) || messages.length === 0) && !req.body.message) {
      return res.status(400).json({
        success: false,
        error: 'Either messages array or message string is required'
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Gemini API key not configured on server'
      });
    }

    const activeModel = initGemini();
    if (!activeModel) {
      return res.status(500).json({
        success: false,
        error: 'Failed to initialize Gemini AI'
      });
    }

    const latestMessageContent = req.body.message 
      ? req.body.message.trim() 
      : messages[messages.length - 1].content.trim();

    if (latestMessageContent.length === 0) {
      return res.status(400).json({ success: false, error: 'Message cannot be empty' });
    }

    if (latestMessageContent.length > 8000) {
      return res.status(400).json({
        success: false,
        error: 'Message too long. Please keep it under 8000 characters.'
      });
    }

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), 25000)
    );

    useDb = chatService.isDbConnected() && sessionId && userId;
    let historyForGemini = [];

    if (useDb) {
      try {
        // Save the user's message to MongoDB
        await chatService.saveMessage(sessionId, userId, 'user', latestMessageContent);
        
        // Fetch full history to send to Gemini
        const savedHistory = await chatService.getChatHistory(sessionId);
        
        // Map messages (excluding the last one which we'll send to Gemini via sendMessage)
        // Gemini expects alternating user/model history
        const maxMessages = 20;
        const messagesToMap = savedHistory.slice(-maxMessages - 1, -1);
        
        historyForGemini = messagesToMap.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        }));
      } catch (dbError) {
        console.error('⚠️ DB operations failed, falling back to memory/request body:', dbError.message);
        useDb = false; // Disable DB saving and fallback to memory
      }
    }

    // Fallback logic if DB is not used or offline
    if (!useDb) {
      const fallbackMessages = messages || [];
      const maxMessages = 20;
      const limitedMessages = fallbackMessages.slice(-maxMessages);
      
      const historyMessages = limitedMessages.slice(0, -1).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));
      
      // Clean history to ensure proper user/model alternation
      let expectedRole = 'user';
      for (const msg of historyMessages) {
        if (msg.role === expectedRole) {
          historyForGemini.push(msg);
          expectedRole = expectedRole === 'user' ? 'model' : 'user';
        }
      }
    }

    // Build chat session with Gemini
    const chat = historyForGemini.length > 0
      ? activeModel.startChat({ history: historyForGemini })
      : activeModel.startChat();

    const chatPromise = chat.sendMessage(latestMessageContent);
    const result = await Promise.race([chatPromise, timeoutPromise]);
    const response = await result.response;
    const botResponse = response.text();

    // If using DB, save the model's response to MongoDB
    if (useDb) {
      try {
        await chatService.saveMessage(sessionId, userId, 'model', botResponse);
      } catch (dbError) {
        console.error('Failed to save AI response to DB:', dbError.message);
      }
    }

    res.json({
      success: true,
      dbStatus: useDb ? 'online' : 'offline',
      response: botResponse,
      timestamp: new Date().toISOString(),
      userId: userId || 'anonymous',
      sessionId: sessionId || null
    });

  } catch (error) {
    console.error('Error in chat with history:', error.message);
    const userMessageContent = req.body.message 
      ? req.body.message 
      : (req.body.messages?.[req.body.messages.length - 1]?.content || '');
      
    const fallbackResponse = generateFallbackResponse(userMessageContent);
    
    // Save fallback response to MongoDB if DB was active
    if (useDb) {
      try {
        await chatService.saveMessage(sessionId, userId, 'model', fallbackResponse);
      } catch (dbError) {
        console.error('Failed to save fallback AI response to DB:', dbError.message);
      }
    }
    
    res.json({
      success: true,
      dbStatus: useDb ? 'online' : 'offline',
      response: fallbackResponse,
      fallback: true,
      timestamp: new Date().toISOString(),
      error: error.message || 'AI service temporarily unavailable'
    });
  }
};

module.exports = {
  getSessions,
  createSession,
  getHistory,
  clearHistory,
  chatWithHistory
};
