const app = require('./app');
const connectDB = require('./config/db');
const env = require('./config/env');

const PORT = env.PORT || 8000;

// Connect to MongoDB
connectDB();

// Start the server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 NVIDIA NIM Chatbot Server is running on port ${PORT}`);
  console.log(`🔑 NVIDIA NIM API key configured: ${!!env.NVIDIA_API_KEY}`);
  console.log(`🌍 Environment: ${env.NODE_ENV}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
});

// Graceful shutdown handlers
const shutdown = (signal) => {
  console.log(`\n📡 ${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log('🛑 Server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
