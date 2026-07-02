const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const chatRoutes = require('./routes/chat.routes');
const authRoutes = require('./routes/auth.routes');
const errorMiddleware = require('./middleware/error.middleware');
const ApiError = require('./utils/ApiError');

const app = express();

// Middlewares
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://main.d3vnb7tglk6hgc.amplifyapp.com"
  ],
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files (Railway/Production build fallback)
// const publicPath = path.join(__dirname, '../public');
// app.use(express.static(publicPath));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Serve the static frontend index page at root
// app.get('/', (req, res) => {
//   res.sendFile(path.join(publicPath, 'index.html'));
// });

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: "NVIDIA Chatbot Backend is running 🚀"
  });
});

// Mount Chat API Routes
app.use('/api', chatRoutes);

// Mount Auth API Routes
app.use('/api/auth', authRoutes);

// Handle 404
app.use((req, res, next) => {
  next(new ApiError(404, `Endpoint not found: ${req.originalUrl}`));
});

// Global Error Handler Middleware
app.use(errorMiddleware);

module.exports = app;
