import React, { createContext, useState, useEffect } from 'react';
import * as authApi from '../services/authApi';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('chat'); // 'chat' | 'login' | 'signup' | 'profile'

  // Check auth status on initial application mount
  useEffect(() => {
    const verifyUserSession = async () => {
      try {
        const response = await authApi.checkAuth();
        if (response.success && response.data) {
          setUser(response.data);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.log('No active user session found (token missing or invalid).');
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    verifyUserSession();
  }, []);

  /**
   * Signup handler (accepts FormData or Object)
   */
  const signup = async (formData) => {
    setLoading(true);
    try {
      const response = await authApi.signup(formData);
      if (response.success && response.data) {
        setUser(response.data);
        setIsAuthenticated(true);
        setCurrentPage('chat'); // Redirect to chat
        return { success: true };
      }
      throw new Error(response.message || 'Registration failed');
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      const errMsg = error.response?.data?.error || error.message || 'Registration failed';
      return { success: false, error: errMsg };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update Profile handler (accepts FormData)
   */
  const updateProfile = async (formData) => {
    setLoading(true);
    try {
      const response = await authApi.updateProfile(formData);
      if (response.success && response.data) {
        setUser(response.data);
        return { success: true, data: response.data };
      }
      throw new Error(response.message || 'Profile update failed');
    } catch (error) {
      const errMsg = error.response?.data?.error || error.message || 'Profile update failed';
      return { success: false, error: errMsg };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Login handler
   */
  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await authApi.login({ email, password });
      if (response.success && response.data) {
        setUser(response.data);
        setIsAuthenticated(true);
        setCurrentPage('chat'); // Redirect to chat
        return { success: true };
      }
      throw new Error(response.message || 'Login failed');
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      const errMsg = error.response?.data?.error || error.message || 'Login failed';
      return { success: false, error: errMsg };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout handler
   */
  const logout = async () => {
    setLoading(true);
    try {
      const response = await authApi.logout();
      if (response.success) {
        setUser(null);
        setIsAuthenticated(false);
        setCurrentPage('chat'); // Redirect to chat
        return { success: true };
      }
      throw new Error(response.message || 'Logout failed');
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message || 'Logout failed' };
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        currentPage,
        setCurrentPage,
        signup,
        updateProfile,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
