import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL - change this to your computer's IP for physical device testing
const BASE_URL = 'http://192.168.1.11/api/v1';
// For physical device, use your computer's IP: 'http://192.168.1.x:5000/api/v1'

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle token expiration
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      // Redirect to login
      // You can implement refresh token logic here
    }
    
    return Promise.reject(error.response?.data || error.message);
  }
);

export default api;