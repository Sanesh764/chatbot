const axios = require('axios');
const env = require('./env');

const nvidiaAxios = axios.create({
  baseURL: 'https://integrate.api.nvidia.com/v1',
  headers: {
    'Authorization': `Bearer ${env.NVIDIA_API_KEY}`,
    'Content-Type': 'application/json'
  },
  timeout: 30000 // 30 seconds timeout
});

module.exports = nvidiaAxios;
