import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Your computer's IP address
const YOUR_IP = '192.168.1.13';
const PORT = '5000';

// Determine base URL based on platform
let BASE_URL;

if (Platform.OS === 'web') {
  // For web, we need to check if window exists
  if (typeof window !== 'undefined' && window.location) {
    const protocol = window.location.protocol === 'https:' ? 'https' : 'http';
    BASE_URL = `${protocol}://${YOUR_IP}:${PORT}/api/v1`;
    console.log('📡 Web protocol:', protocol);
  } else {
    // Fallback for web if window is not available
    BASE_URL = `http://${YOUR_IP}:${PORT}/api/v1`;
  }
} else {
  // For mobile (iOS/Android), always use http
  BASE_URL = `http://${YOUR_IP}:${PORT}/api/v1`;
}

console.log('📡 Platform:', Platform.OS);
console.log('📡 API Base URL:', BASE_URL);

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor to add token
api.interceptors.request.use(
  async (config) => {
    console.log('📤 Request:', config.method.toUpperCase(), config.url);
    
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('🔑 Token added to request');
      }
    } catch (error) {
      console.error('❌ Error getting token:', error);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('📥 Response:', response.status);
    return response.data;
  },
  async (error) => {
    console.error('❌ API Error:', error.message);
    
    if (error.code === 'ECONNABORTED') {
      console.error('❌ Request timeout');
      return Promise.reject({ message: 'Request timeout - server too slow' });
    }
    
    if (error.response) {
      // The request was made and the server responded with a status code
      console.error('❌ Error status:', error.response.status);
      console.error('❌ Error data:', error.response.data);
      return Promise.reject(error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('❌ No response received - is the server running?');
      return Promise.reject({ 
        message: 'Cannot connect to server. Make sure:\n' +
                '1. Backend is running (npm start in backend folder)\n' +
                '2. Phone and computer are on same WiFi\n' +
                '3. IP address is correct: ' + YOUR_IP
      });
    } else {
      // Something happened in setting up the request
      console.error('❌ Request setup error:', error.message);
      return Promise.reject({ message: error.message });
    }
  }
);

export default api;