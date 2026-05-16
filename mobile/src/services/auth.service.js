import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthService = {
  // Login user
  login: async (email, password) => {
    console.log('🔑 AuthService.login called with:', { email });
    try {
      console.log('📤 Sending login request to API...');
      const response = await api.post('/auth/login', { email, password });
      console.log('📥 API response received:', response);
      
      if (response.success) {
        console.log('✅ Login successful, storing token...');
        await AsyncStorage.setItem('token', response.data.token);
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
        console.log('✅ Token stored successfully');
      }
      
      return response;
    } catch (error) {
      console.error('❌ AuthService.login error:', error);
      throw error;
    }
  },

  // Register user
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      
      if (response.success) {
        await AsyncStorage.setItem('token', response.data.token);
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response;
    } catch (error) {
      console.error('❌ Register error:', error);
      throw error;
    }
  },

  // Get current user profile
  getProfile: async () => {
    try {
      const response = await api.get('/auth/profile');
      return response;
    } catch (error) {
      console.error('❌ Get profile error:', error);
      throw error;
    }
  },

  // Check if user is authenticated
  isAuthenticated: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      return !!token;
    } catch (error) {
      console.error('❌ Check auth error:', error);
      return false;
    }
  },

  // Get stored user
  getCurrentUser: async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('❌ Get user error:', error);
      return null;
    }
  },

  // Logout
  logout: async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  },
};

export default AuthService;