const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const chatRoutes = require('./routes/chatRoutes');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files (Railway/Production build fallback)
const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));

// Mount Chat API Routes
app.use('/api', chatRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Serve the static frontend index page at root
app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Legacy /api/chat simple endpoint for backward compatibility (non-history chat)
const { GoogleGenerativeAI } = require('@google/generative-ai');
app.post('/api/chat', async (req, res) => {
  try {
    const { message, userId } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid message is required'
      });
    }

    if (message.length > 8000) {
      return res.status(400).json({
        success: false,
        error: 'Message too long. Please keep it under 8000 characters.'
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Gemini API key not configured'
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), 25000)
    );

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
    res.json({
      success: true,
      response: `I understand you said: "${req.body.message}". I'm currently experiencing technical issues, but I'm here to help. Could you try rephrasing your question?`,
      fallback: true,
      timestamp: new Date().toISOString(),
      error: 'AI service temporarily unavailable'
    });
  }
});

// Test API endpoint (checks key status)
app.get('/api/test', (req, res) => {
  const hasApiKey = !!process.env.GEMINI_API_KEY;
  const mongoose = require('mongoose');
  res.json({
    message: 'API test endpoint',
    hasApiKey: hasApiKey,
    keyLength: hasApiKey ? process.env.GEMINI_API_KEY.length : 0,
    databaseConnected: mongoose.connection.readyState === 1,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: [
      '/',
      '/health',
      '/api/test',
      '/api/chat',
      '/api/chat-with-history',
      '/api/sessions',
      '/api/sessions/:sessionId/history'
    ]
  });
});

// Handle server errors
app.use((error, req, res, next) => {
  console.error('Server error:', error.message);
  res.status(500).json({
    success: false,
    error: 'Something went wrong on the server!',
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
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
