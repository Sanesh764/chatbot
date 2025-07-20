
// test-api.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function testGeminiAPI() {
  try {
    console.log('Testing Gemini API...');
    console.log('API Key configured:', !!process.env.GEMINI_API_KEY);
    console.log('API Key length:', process.env.GEMINI_API_KEY?.length);
    
    if (!process.env.GEMINI_API_KEY) {
      console.error('❌ No API key found in .env file');
      return;
    }

    // Initialize the API
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    console.log('Sending test message to Gemini...');
    
    // Test with a simple question
    const result = await model.generateContent("What is an array in programming?");
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Success! Gemini responded:');
    console.log(text);
    
  } catch (error) {
    console.error('❌ Error testing Gemini API:');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    
    if (error.message.includes('API key')) {
      console.error('🔑 This looks like an API key issue. Please check:');
      console.error('1. Your API key is correct in the .env file');
      console.error('2. The API key has proper permissions');
      console.error('3. Billing is enabled on your Google Cloud account');
    }
  }
}

testGeminiAPI();