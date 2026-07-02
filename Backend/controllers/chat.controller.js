const chatService = require('../services/chatService');
const nvidiaService = require('../services/nvidia.service');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

/**
 * Helper to generate fallback responses when NVIDIA NIM is offline.
 */
function generateFallbackResponse(userMessage) {
  const responses = {
    'hello': 'Hi there! How can I help you today?',
    'hi': 'Hello! What can I do for you?',
    'how are you': "I'm doing well, thank you for asking! How can I assist you?",
    'bye': 'Goodbye! Have a great day!',
    'goodbye': 'Farewell! Feel free to come back anytime!',
    'help': "I'm here to help! What do you need assistance with?",
    'thanks': "You're welcome! Is there anything else I can help you with?",
    'thank you': "You're welcome! Is there anything else I can help you with?",
    'what can you do': "I'm an AI chatbot that can answer questions and assist with many topics!",
    'who are you': "I'm your friendly AI chatbot assistant!"
  };

  if (!userMessage) {
    return "I didn't receive your message. Could you try again?";
  }

  const lowerMessage = userMessage.toLowerCase().trim();
  if (responses[lowerMessage]) return responses[lowerMessage];

  for (let key in responses) {
    if (lowerMessage.includes(key)) return responses[key];
  }

  return `I understand you said: "${userMessage}". I'm currently experiencing technical issues with the NVIDIA NIM service, but I'm here to help. Could you try rephrasing your question?`;
}

/**
 * Get all sessions for a user
 */
const getSessions = async (req, res, next) => {
  const { userId } = req.query;
  if (!userId) {
    throw new ApiError(400, 'userId query parameter is required');
  }

  if (!chatService.isDbConnected()) {
    return res.status(200).json(
      new ApiResponse(200, { dbStatus: 'offline', sessions: [] }, 'Database is offline')
    );
  }

  const sessions = await chatService.getSessionsByUser(userId);
  res.status(200).json(
    new ApiResponse(200, { dbStatus: 'online', sessions }, 'Sessions retrieved successfully')
  );
};

/**
 * Create or retrieve a chat session
 */
const createSession = async (req, res, next) => {
  const { sessionId, userId, title } = req.body;
  if (!sessionId || !userId) {
    throw new ApiError(400, 'sessionId and userId are required');
  }

  if (!chatService.isDbConnected()) {
    return res.status(200).json(
      new ApiResponse(200, {
        dbStatus: 'offline',
        session: { sessionId, userId, title: title || 'New Conversation' }
      }, 'Session created in memory (Database offline)')
    );
  }

  const session = await chatService.getOrCreateSession(sessionId, userId, title);
  res.status(200).json(
    new ApiResponse(200, { dbStatus: 'online', session }, 'Session initialized successfully')
  );
};

/**
 * Get chat history for a session
 */
const getHistory = async (req, res, next) => {
  const { sessionId } = req.params;
  if (!sessionId) {
    throw new ApiError(400, 'sessionId parameter is required');
  }

  if (!chatService.isDbConnected()) {
    return res.status(200).json(
      new ApiResponse(200, { dbStatus: 'offline', messages: [] }, 'Database is offline')
    );
  }

  const messages = await chatService.getChatHistory(sessionId);
  res.status(200).json(
    new ApiResponse(200, { dbStatus: 'online', messages }, 'History retrieved successfully')
  );
};

/**
 * Clear chat history for a session
 */
const clearHistory = async (req, res, next) => {
  const { sessionId } = req.params;
  if (!sessionId) {
    throw new ApiError(400, 'sessionId parameter is required');
  }

  if (!chatService.isDbConnected()) {
    return res.status(200).json(
      new ApiResponse(200, { dbStatus: 'offline' }, 'History cleared locally (Database offline)')
    );
  }

  await chatService.clearChatHistory(sessionId);
  res.status(200).json(
    new ApiResponse(200, { dbStatus: 'online' }, 'Chat history cleared successfully')
  );
};

/**
 * Send chat message and get AI response with history support (MongoDB/Fallback hybrid)
 */
const chatWithHistory = async (req, res, next) => {
  const { messages, userId, sessionId, stream = false } = req.body;
  let useDb = false;

  if ((!messages || !Array.isArray(messages) || messages.length === 0) && !req.body.message) {
    throw new ApiError(400, 'Either messages array or message string is required');
  }

  const latestMessageContent = req.body.message 
    ? req.body.message.trim() 
    : messages[messages.length - 1].content.trim();

  if (latestMessageContent.length === 0) {
    throw new ApiError(400, 'Message cannot be empty');
  }

  if (latestMessageContent.length > 8000) {
    throw new ApiError(400, 'Message too long. Please keep it under 8000 characters.');
  }

  useDb = chatService.isDbConnected() && sessionId && userId;
  let formattedHistory = [];

  if (useDb) {
    try {
      // Save the user's message to MongoDB
      await chatService.saveMessage(sessionId, userId, 'user', latestMessageContent);
      
      // Fetch full history to send to NVIDIA
      const savedHistory = await chatService.getChatHistory(sessionId);
      
      // Map history for OpenAI compatibility (NVIDIA format)
      // Map roles: 'model' -> 'assistant', 'user' -> 'user', 'system' -> 'system'
      // Limit to last 20 messages for context size efficiency
      const maxHistory = 20;
      const historyToMap = savedHistory.slice(-maxHistory);
      
      formattedHistory = historyToMap.map(msg => ({
        role: (msg.role === 'model' || msg.role === 'ai') ? 'assistant' : msg.role,
        content: msg.content
      }));
    } catch (dbError) {
      console.error('⚠️ DB operations failed, falling back to memory history:', dbError.message);
      useDb = false; // Disable DB saving and fallback to memory/request messages
    }
  }

  // Fallback history loading if DB offline or bypassed
  if (!useDb) {
    const fallbackMessages = messages || [];
    const maxMessages = 20;
    const limitedMessages = fallbackMessages.slice(-maxMessages);
    
    formattedHistory = limitedMessages.map(msg => ({
      role: (msg.role === 'model' || msg.role === 'ai') ? 'assistant' : msg.role,
      content: msg.content
    }));

    // If the latest message was not yet inside formattedHistory, add it
    const lastMapped = formattedHistory[formattedHistory.length - 1];
    if (!lastMapped || lastMapped.content !== latestMessageContent || lastMapped.role !== 'user') {
      formattedHistory.push({
        role: 'user',
        content: latestMessageContent
      });
    }
  }

  // Call NVIDIA NIM service
  try {
    const apiResponse = await nvidiaService.chatCompletion(formattedHistory, { stream });

    if (stream) {
      // Handle Streaming (SSE)
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders(); // Establish connection immediately

      let accumulatedResponse = '';
      let buffer = '';

      apiResponse.data.on('data', async (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        
        // Save the last partial line back to buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const cleanLine = line.trim();
          if (cleanLine === '') continue;
          if (cleanLine === 'data: [DONE]') continue;
          
          if (cleanLine.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(cleanLine.slice(6));
              const content = parsed.choices?.[0]?.delta?.content || '';
              if (content) {
                accumulatedResponse += content;
                res.write(`data: ${JSON.stringify({ content })}\n\n`);
              }
            } catch (err) {
              // Ignore malformed/partial JSON buffers
            }
          }
        }
      });

      apiResponse.data.on('end', async () => {
        // Parse any remaining buffer
        if (buffer.trim().startsWith('data: ') && buffer.trim() !== 'data: [DONE]') {
          try {
            const parsed = JSON.parse(buffer.trim().slice(6));
            const content = parsed.choices?.[0]?.delta?.content || '';
            if (content) {
              accumulatedResponse += content;
              res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
          } catch (err) {}
        }

        // Save AI response to DB
        if (useDb && accumulatedResponse.trim()) {
          try {
            await chatService.saveMessage(sessionId, userId, 'model', accumulatedResponse.trim());
          } catch (dbError) {
            console.error('Failed to save streamed AI response to DB:', dbError.message);
          }
        }
        
        res.write('data: [DONE]\n\n');
        res.end();
      });

      apiResponse.data.on('error', (streamErr) => {
        console.error('NVIDIA Response Stream Error:', streamErr.message);
        res.write(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`);
        res.end();
      });

    } else {
      // Handle Standard JSON response
      const botResponse = apiResponse.data.choices?.[0]?.message?.content || '';
      
      // Save standard AI response to DB
      if (useDb && botResponse) {
        try {
          await chatService.saveMessage(sessionId, userId, 'model', botResponse);
        } catch (dbError) {
          console.error('Failed to save AI response to DB:', dbError.message);
        }
      }

      res.status(200).json({
        success: true,
        dbStatus: useDb ? 'online' : 'offline',
        response: botResponse,
        timestamp: new Date().toISOString(),
        userId: userId || 'anonymous',
        sessionId: sessionId || null
      });
    }

  } catch (error) {
    console.error('Error in chatWithHistory controller:', error.message);
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
    
    if (stream) {
      // If we errored out before/during streaming, write it to SSE and end
      res.setHeader('Content-Type', 'text/event-stream');
      res.write(`data: ${JSON.stringify({ error: error.message || 'AI service unavailable' })}\n\n`);
      res.write(`data: ${JSON.stringify({ content: fallbackResponse })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      res.status(200).json({
        success: true,
        dbStatus: useDb ? 'online' : 'offline',
        response: fallbackResponse,
        fallback: true,
        timestamp: new Date().toISOString(),
        error: error.message || 'AI service temporarily unavailable'
      });
    }
  }
};

/**
 * Test API endpoint (checks key status and database status)
 */
const getTest = (req, res, next) => {
  const env = require('../config/env');
  const mongoose = require('mongoose');
  const hasApiKey = !!env.NVIDIA_API_KEY;
  res.status(200).json({
    message: 'API test endpoint',
    hasApiKey: hasApiKey,
    keyLength: hasApiKey ? env.NVIDIA_API_KEY.length : 0,
    databaseConnected: mongoose.connection.readyState === 1,
    environment: env.NODE_ENV || 'development'
  });
};

module.exports = {
  getSessions,
  createSession,
  getHistory,
  clearHistory,
  chatWithHistory,
  getTest
};
