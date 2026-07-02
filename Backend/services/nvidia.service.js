const nvidiaAxios = require('../config/axios');
const ApiError = require('../utils/ApiError');

class NvidiaService {
  /**
   * Generates chat completion from NVIDIA NIM API
   * @param {Array} messages - List of conversation messages formatted for OpenAI format: [{ role, content }]
   * @param {Object} options - Completion parameters (model, temperature, top_p, max_tokens, stream)
   * @returns {Promise<Object>} Axios response object
   */
  static async chatCompletion(messages, options = {}) {
    const {
      model = 'google/diffusiongemma-26b-a4b-it',
      temperature = 1.0,
      top_p = 0.95,
      max_tokens = 1024,
      stream = false
    } = options;

    const payload = {
      model,
      messages,
      temperature,
      top_p,
      max_tokens,
      stream
    };

    try {
      const response = await nvidiaAxios.post('/chat/completions', payload, {
        responseType: stream ? 'stream' : 'json',
        headers: {
          'Accept': stream ? 'text/event-stream' : 'application/json'
        }
      });
      return response;
    } catch (error) {
      console.error('NVIDIA NIM API error:', error.response?.data || error.message);
      const statusCode = error.response?.status || 500;
      
      // Attempt to extract detail error message from NVIDIA response
      let detailMsg = error.message;
      if (error.response?.data) {
        if (typeof error.response.data === 'object') {
          detailMsg = error.response.data.error?.message || JSON.stringify(error.response.data);
        } else {
          detailMsg = error.response.data;
        }
      }
      
      throw new ApiError(statusCode, `NVIDIA NIM API Error: ${detailMsg}`);
    }
  }
}

module.exports = NvidiaService;
