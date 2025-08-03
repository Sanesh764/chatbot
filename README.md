# 🤖 AI Chatbot with Modern Frontend

A beautiful, modern AI chatbot powered by Google Gemini AI with a responsive frontend and robust backend.

## ✨ Features

### Frontend
- 🎨 **Modern UI/UX** - Clean, responsive design with smooth animations
- 🌙 **Dark/Light Mode** - Toggle between themes with persistent preference
- 💬 **Real-time Chat** - Instant messaging with typing indicators
- 📱 **Mobile Responsive** - Works perfectly on all devices
- 💾 **Message Persistence** - Chat history saved locally
- ⚡ **Auto-resize Input** - Dynamic textarea that grows with content
- 🔄 **Conversation History** - Maintains context across messages
- 🎯 **Character Counter** - Track message length with visual feedback
- 🔗 **Connection Status** - Real-time server connectivity indicator

### Backend
- 🤖 **Google Gemini AI** - Powered by Gemini 1.5 Flash model
- 🔄 **Conversation Memory** - Maintains chat context and history
- ⏱️ **Request Timeout** - 25-second timeout with fallback responses
- 🛡️ **Input Validation** - Comprehensive message validation
- 🔒 **Error Handling** - Graceful error handling with fallback responses
- 📊 **Health Monitoring** - Server health check endpoints
- 🌐 **CORS Enabled** - Cross-origin request support

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Google Gemini API key

### 1. Setup Backend

```bash
cd Backend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the Backend directory:

```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=8080
NODE_ENV=development
```

### 3. Start the Server

```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:8080`

### 4. Access the Frontend

Open your browser and navigate to:
```
http://localhost:8080
```

## 🔧 API Endpoints

### Chat Endpoints
- `POST /api/chat` - Single message chat
- `POST /api/chat-with-history` - Chat with conversation history
- `GET /api/test` - Test API key configuration

### Utility Endpoints
- `GET /` - Server status and available endpoints
- `GET /health` - Health check for deployment platforms

## 🎨 Frontend Features

### Theme System
- Automatic theme detection based on system preference
- Manual toggle with persistent storage
- Smooth transitions between themes

### Message Features
- User and bot message differentiation
- Timestamp display with relative time
- Message animations and smooth scrolling
- Error message styling

### Input Features
- Auto-expanding textarea
- Character counter with visual feedback
- Enter to send (Shift+Enter for new line)
- Send button with loading states

### Responsive Design
- Mobile-first approach
- Adaptive layouts for all screen sizes
- Touch-friendly interface
- Optimized for both portrait and landscape

## 🛠️ Development

### Project Structure
```
chatbot/
├── Backend/
│   ├── server.js          # Main server file
│   ├── package.json       # Dependencies
│   └── .env              # Environment variables
├── public/
│   ├── index.html        # Main HTML file
│   ├── styles.css        # Modern CSS with themes
│   └── script.js         # Frontend JavaScript
└── README.md             # This file
```

### Backend Dependencies
- `express` - Web framework
- `@google/generative-ai` - Google Gemini AI SDK
- `cors` - Cross-origin resource sharing
- `dotenv` - Environment variable management

### Frontend Technologies
- Vanilla JavaScript (ES6+)
- Modern CSS with CSS Variables
- Font Awesome icons
- Google Fonts (Inter)

## 🔒 Security Features

- Input validation and sanitization
- Request size limits (10MB)
- Message length limits (8000 characters)
- CORS configuration
- Error handling without exposing sensitive data

## 🚀 Deployment

### Local Development
```bash
# Terminal 1 - Backend
cd Backend
npm run dev

# Terminal 2 - Frontend (optional, served by backend)
# The backend serves the frontend from the public folder
```

### Production Deployment
1. Set `NODE_ENV=production` in your environment
2. Ensure your `GEMINI_API_KEY` is properly configured
3. Deploy to your preferred platform (Heroku, Vercel, Railway, etc.)

## 🐛 Troubleshooting

### Common Issues

**1. "API key not configured" error**
- Ensure your `.env` file exists in the Backend directory
- Verify your `GEMINI_API_KEY` is correct
- Restart the server after adding the API key

**2. Frontend not loading**
- Check if the server is running on the correct port
- Verify the `public` folder is in the correct location
- Check browser console for errors

**3. Messages not sending**
- Check network connectivity
- Verify the backend is running
- Check browser console for API errors

**4. Theme not persisting**
- Clear browser cache and local storage
- Check if localStorage is enabled in your browser

## 📱 Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Google Gemini AI for the AI capabilities
- Font Awesome for the beautiful icons
- Inter font family for typography

---
live demo link :--- https://chatbot-git-main-saneshs-projects-caa51d20.vercel.app

**Happy Chatting! 🤖✨** 
