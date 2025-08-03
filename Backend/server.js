const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Middleware
app.use(cors()); // Allow cross-origin requests
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies with size limit
app.use(express.urlencoded({ extended: true }));

// Serve static files (if you have frontend files)
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Basic route to test server
app.get('/', (req, res) => {
  res.json({ 
    message: 'AI Chatbot is running successfully!',
    version: '1.0.0',
    endpoints: ['/api/chat', '/api/chat-with-history', '/api/test'],
    timestamp: new Date().toISOString()
  });
});

// Test API key endpoint
app.get('/api/test', (req, res) => {
  const hasApiKey = !!process.env.GEMINI_API_KEY;
  res.json({ 
    message: 'API test endpoint',
    hasApiKey: hasApiKey,
    keyLength: hasApiKey ? process.env.GEMINI_API_KEY.length : 0,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Chatbot endpoint - integrates with Gemini AI
app.post('/api/chat', async (req, res) => {
  try {
    const { message, userId } = req.body;
    
    // Input validation
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid message is required'
      });
    }

    // Check message length
    if (message.length > 8000) {
      return res.status(400).json({
        success: false,
        error: 'Message too long. Please keep it under 8000 characters.'
      });
    }

    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Gemini API key not configured'
      });
    }

    // Generate AI response using Gemini with timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 25000); // 25 second timeout
    });

    const aiPromise = model.generateContent(message.trim());
    
    const result = await Promise.race([aiPromise, timeoutPromise]);
    const response = await result.response;
    const botResponse = response.text();

    res.json({
      success: true,
      response: botResponse,
      timestamp: new Date().toISOString(),
      userId: userId || 'anonymous'
    });

  } catch (error) {
    console.error('Error generating response:', error.message);
    
    // Fallback to simple response if AI fails
    const fallbackResponse = generateFallbackResponse(req.body.message);
    
    res.json({
      success: true,
      response: fallbackResponse,
      timestamp: new Date().toISOString(),
      fallback: true,
      error: 'AI service temporarily unavailable'
    });
  }
});

// Chat with conversation history endpoint - FIXED VERSION
app.post('/api/chat-with-history', async (req, res) => {
  try {
    const { messages, userId } = req.body;
    
    // Input validation
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Messages array is required and must not be empty'
      });
    }

    // Limit conversation history
    const maxMessages = 20;
    const limitedMessages = messages.slice(-maxMessages);

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Gemini API key not configured'
      });
    }

    // Format conversation history for Gemini (exclude the latest message for history)
    let historyMessages = limitedMessages.slice(0, -1).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // Ensure history starts with a user message and maintains proper alternating structure
    const cleanHistory = [];
    let expectedRole = 'user';
    
    for (const msg of historyMessages) {
      if (msg.role === expectedRole) {
        cleanHistory.push(msg);
        expectedRole = expectedRole === 'user' ? 'model' : 'user';
      }
      // Skip messages that don't follow the alternating pattern
    }

    // Debug logging (optional - remove in production)
    console.log('Clean history length:', cleanHistory.length);
    if (cleanHistory.length > 0) {
      console.log('First message role:', cleanHistory[0].role);
    }

    // Start chat with or without history
    const chat = cleanHistory.length > 0 
      ? model.startChat({ history: cleanHistory })
      : model.startChat();

    // Send the latest message with timeout
    const latestMessage = limitedMessages[limitedMessages.length - 1];
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 25000);
    });

    const chatPromise = chat.sendMessage(latestMessage.content);
    
    const result = await Promise.race([chatPromise, timeoutPromise]);
    const response = await result.response;
    const botResponse = response.text();

    res.json({
      success: true,
      response: botResponse,
      timestamp: new Date().toISOString(),
      userId: userId || 'anonymous'
    });

  } catch (error) {
    console.error('Error in chat with history:', error.message);
    
    const fallbackResponse = generateFallbackResponse(
      req.body.messages?.[req.body.messages.length - 1]?.content || ''
    );
    
    res.json({
      success: true,
      response: fallbackResponse,
      timestamp: new Date().toISOString(),
      fallback: true,
      error: 'AI service temporarily unavailable'
    });
  }
});

// Fallback response function (used when AI fails)
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
    'what can you do': 'I\'m an AI chatbot that can help answer questions, have conversations, and provide assistance on various topics!',
    'who are you': 'I\'m your friendly AI chatbot assistant, here to help with your questions and conversations!'
  };
  
  if (!userMessage) {
    return 'I didn\'t receive your message. Could you please try again?';
  }
  
  const lowerMessage = userMessage.toLowerCase().trim();
  
  // Check for exact matches
  if (responses[lowerMessage]) {
    return responses[lowerMessage];
  }
  
  // Check for partial matches
  for (let key in responses) {
    if (lowerMessage.includes(key)) {
      return responses[key];
    }
  }
  
  // Default response
  return `I understand you said: "${userMessage}". I'm currently experiencing some technical difficulties with my AI service, but I'm here to help! Could you try rephrasing your question?`;
}

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: ['/', '/api/chat', '/api/chat-with-history', '/api/test', '/health']
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error.message);
  res.status(500).json({ 
    success: false,
    error: 'Something went wrong on the server!',
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 AI Chatbot Server is running on port ${PORT}`);
  console.log(`🔑 Gemini API key configured: ${!!process.env.GEMINI_API_KEY}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
});
