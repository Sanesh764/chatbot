const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Middleware
app.use(cors()); // Allow cross-origin requests
app.use(express.json()); // Parse JSON bodies

// Basic route to test server
app.get('/', (req, res) => {
  res.json({ message: 'Chatbot backend is running!' });
});

// Test API key endpoint
app.get('/api/test', (req, res) => {
  const hasApiKey = !!process.env.GEMINI_API_KEY;
  res.json({ 
    message: 'API test endpoint',
    hasApiKey: hasApiKey,
    keyLength: hasApiKey ? process.env.GEMINI_API_KEY.length : 0
  });
});

// Chatbot endpoint - integrates with Gemini AI
app.post('/api/chat', async (req, res) => {
  try {
    const { message, userId } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Gemini API key not configured'
      });
    }

    // Generate AI response using Gemini
    const result = await model.generateContent(message);
    const response = await result.response;
    const botResponse = response.text();

    res.json({
      success: true,
      response: botResponse,
      timestamp: new Date().toISOString(),
      userId: userId || 'anonymous'
    });

  } catch (error) {
    console.error('Error generating response:', error);
    
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

// Chat with conversation history endpoint
app.post('/api/chat-with-history', async (req, res) => {
  try {
    const { messages, userId } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        error: 'Messages array is required'
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Gemini API key not configured'
      });
    }

    // Format conversation history for Gemini
    const chat = model.startChat({
      history: messages.slice(0, -1).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }))
    });

    // Send the latest message
    const latestMessage = messages[messages.length - 1];
    const result = await chat.sendMessage(latestMessage.content);
    const response = await result.response;
    const botResponse = response.text();

    res.json({
      success: true,
      response: botResponse,
      timestamp: new Date().toISOString(),
      userId: userId || 'anonymous'
    });

  } catch (error) {
    console.error('Error in chat with history:', error);
    
    const fallbackResponse = generateFallbackResponse(req.body.messages?.[req.body.messages.length - 1]?.content || '');
    
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
    'how are you': 'I\'m doing well, thank you for asking!',
    'bye': 'Goodbye! Have a great day!',
    'help': 'I\'m here to help! What do you need assistance with?',
    'thanks': 'You\'re welcome! Is there anything else I can help you with?',
    'thank you': 'You\'re welcome! Is there anything else I can help you with?'
  };
  
  if (!userMessage) {
    return 'I didn\'t receive your message. Could you please try again?';
  }
  
  const lowerMessage = userMessage.toLowerCase();
  
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

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ 
    success: false,
    error: 'Something went wrong on the server!' 
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Gemini API key configured: ${!!process.env.GEMINI_API_KEY}`);
});