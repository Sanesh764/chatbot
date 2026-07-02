import axios from 'axios';

// Create a central Axios instance for standard Auth operations
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  withCredentials: true, // Crucial for cross-domain cookie validation on separately deployed services
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 15000
});

/**
 * Register a new user (supports optional avatar upload using FormData)
 */
export const signup = async (formData) => {
  const isMultipart = formData instanceof FormData;
  const response = await api.post('/auth/signup', formData, {
    headers: {
      'Content-Type': isMultipart ? 'multipart/form-data' : 'application/json'
    }
  });
  return response.data;
};

/**
 * Update user profile settings (supports optional avatar upload using FormData)
 */
export const updateProfile = async (formData) => {
  const response = await api.put('/auth/profile', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

/**
 * Authenticate credentials and login user
 */
export const login = async ({ email, password }) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

/**
 * Terminate user session and clear HttpOnly cookie token
 */
export const logout = async () => {
  const response = await api.post('/auth/logout');
  return response.data;
};

/**
 * Retrieve user metadata
 */
export const getProfile = async () => {
  const response = await api.get('/auth/profile');
  return response.data;
};

/**
 * Validate token session validity on bootstrap load
 */
export const checkAuth = async () => {
  const response = await api.get('/auth/check-auth');
  return response.data;
};
