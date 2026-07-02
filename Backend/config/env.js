const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from the .env file in the Backend directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const env = {
  PORT: process.env.PORT || 8000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot',
  NVIDIA_API_KEY: process.env.NVIDIA_API_KEY,
  JWT_SECRET: process.env.JWT_SECRET || 'nv-chatbot-jwt-secret-key-321-def-987-xyz-654-abc',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  NODE_ENV: process.env.NODE_ENV || 'development'
};

// Check if NVIDIA_API_KEY is present
if (!env.NVIDIA_API_KEY) {
  console.warn('⚠️ WARNING: NVIDIA_API_KEY is not defined in the environment variables (.env)!');
}

module.exports = env;
