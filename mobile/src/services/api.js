import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const API_PREFIX = '/api/v1';
const PORT = '5000';
const DEFAULT_HOST = '192.168.1.5'; // Change in .env instead

const getBackendHost = () => {
  // Use EXPO_PUBLIC_API_URL from .env if defined
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Fallback to local loopback for emulators
  if (!Constants.isDevice) {
    if (Platform.OS === 'android') {
      return `http://10.0.2.2:${PORT}`;
    }
    if (Platform.OS === 'ios') {
      return `http://localhost:${PORT}`;
    }
  }

  // Default LAN IP
  return `http://${DEFAULT_HOST}:${PORT}`;
};

const BASE_URL = `${getBackendHost()}${API_PREFIX}`;

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    // Bypass interstitial pages from tunnel services
    'bypass-tunnel-reminder': 'true',       // localtunnel bypass
    'ngrok-skip-browser-warning': 'true',   // ngrok bypass
  },
  timeout: 30000, // 30 second timeout for long requests like OCR
});

// Request interceptor to add token
api.interceptors.request.use(
  async (config) => {

    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
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