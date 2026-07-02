const mongoose = require('mongoose');

const dns=require("dns");
dns.setServers([
  '1.1.1.1',
  '8.8.8.8'
]);
const connectDB = async () => {
  const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot';
  
  try {
    const conn = await mongoose.connect(dbUri); 
      //serverSelectionTimeoutMS: 30000, // Timeout after 5 seconds instead of 30 seconds
    //});
    console.log(`📡 MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.log('⚠️ Running in offline database fallback mode. Operations will fall back to local storage.');
    // We do NOT call process.exit(1) here so that the server remains alive and handles requests in fallback mode.
    return null;
  }
};

module.exports = connectDB;
