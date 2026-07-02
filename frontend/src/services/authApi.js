import axios from 'axios';

const api = axios.create({
  baseURL: '',
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
  const response = await api.post('/api/auth/signup', formData, {
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
  const response = await api.put('/api/auth/profile', formData, {
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
  const response = await api.post('/api/auth/login', { email, password });
  return response.data;
};

/**
 * Terminate user session and clear HttpOnly cookie token
 */
export const logout = async () => {
  const response = await api.post('/api/auth/logout');
  return response.data;
};

/**
 * Retrieve user metadata
 */
export const getProfile = async () => {
  const response = await api.get('/api/auth/profile');
  return response.data;
};

/**
 * Validate token session validity on bootstrap load
 */
export const checkAuth = async () => {
  const response = await api.get('/api/auth/check-auth');
  return response.data;
};
