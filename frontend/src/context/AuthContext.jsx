import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Set axios default headers and base URL
  useEffect(() => {
    // Set base URL
    axios.defaults.baseURL = 'http://localhost:5000';
    
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await axios.get('/api/auth/me');
      setUser(response.data.user);
    } catch (error) {
      console.error('Error fetching user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  // Send OTP
  const sendOTP = async (phone) => {
    try {
      console.log('AuthContext: Sending OTP to', phone);
      const response = await axios.post('/api/auth/send-otp', { phone });
      console.log('AuthContext: OTP response', response.data);
      return response.data;
    } catch (error) {
      console.error('AuthContext: Send OTP error', error);
      throw error;
    }
  };

  // Resend OTP
  const resendOTP = async (phone) => {
    try {
      console.log('AuthContext: Resending OTP to', phone);
      const response = await axios.post('/api/auth/resend-otp', { phone });
      console.log('AuthContext: Resend OTP response', response.data);
      return response.data;
    } catch (error) {
      console.error('AuthContext: Resend OTP error', error);
      throw error;
    }
  };

  // Login with phone + OTP
  const login = async (phone, otp) => {
    try {
      console.log('AuthContext: Logging in with', phone, otp);
      const response = await axios.post('/api/auth/login', { phone, otp });
      console.log('AuthContext: Login response', response.data);
      
      const { token: newToken, user: userData } = response.data;
      
      // Save to localStorage
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Set auth header
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      // Update state
      setToken(newToken);
      setUser(userData);
      
      return userData;
    } catch (error) {
      console.error('AuthContext: Login error', error);
      throw error;
    }
  };

  // Register with phone + OTP
  const register = async (userData) => {
    try {
      console.log('AuthContext: Registering user', userData);
      const response = await axios.post('/api/auth/register', userData);
      console.log('AuthContext: Register response', response.data);
      
      const { token: newToken, user: newUser } = response.data;
      
      // Save to localStorage
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      
      // Set auth header
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      // Update state
      setToken(newToken);
      setUser(newUser);
      
      return newUser;
    } catch (error) {
      console.error('AuthContext: Register error', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put('/api/auth/update-profile', profileData);
      setUser(response.data.user);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Profile update failed',
      };
    }
  };

  const value = {
    user,
    token,
    loading,
    sendOTP,
    resendOTP,
    login,
    register,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};