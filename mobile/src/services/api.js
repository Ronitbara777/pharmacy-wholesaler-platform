import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// ─── REMOTE TESTING CONFIG ──────────────────────────────────────────────────
// When sharing app with a remote client, paste your ngrok URL here and
// set USE_NGROK = true. Set back to false for local WiFi testing.
const USE_NGROK = true;
const NGROK_URL = 'https://block-legacy-feof-sherman.trycloudflare.com';
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_HOST = '192.168.1.5';
const PORT = '5000';
const API_PREFIX = '/api/v1';

const parseHostFromString = (hostString) => {
  if (!hostString || typeof hostString !== 'string') return null;
  if (hostString.includes('://')) {
    try {
      const parsed = new URL(hostString);
      return parsed.hostname;
    } catch {
      // ignore invalid URL
    }
  }
  return hostString.split(':')[0];
};

const getExpoHost = () => {
  const hostCandidates = [
    Constants.manifest?.debuggerHost,
    Constants.manifest?.packagerOpts?.devClient?.debuggerHost,
    Constants.manifest2?.debuggerHost,
    Constants.manifest2?.packagerOpts?.devClient?.debuggerHost,
    Constants.expoConfig?.hostUri,
    Constants.manifest?.hostUri,
    Constants.expoConfig?.extra?.backendHost,
    Constants.manifest?.extra?.backendHost,
    Constants.manifest2?.extra?.backendHost,
  ];

  for (const hostString of hostCandidates) {
    const host = parseHostFromString(hostString);
    if (host && host !== '127.0.0.1' && host !== 'localhost') {
      return host;
    }
  }

  return null;
};

const getBackendHost = () => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location) {
      return window.location.hostname || DEFAULT_HOST;
    }
    return DEFAULT_HOST;
  }

  const expoHost = getExpoHost();
  if (expoHost) {
    return expoHost;
  }

  // Use emulator loopback only when running inside a simulator/emulator
  if (!Constants.isDevice) {
    if (Platform.OS === 'android') {
      return '10.0.2.2';
    }
    if (Platform.OS === 'ios') {
      return 'localhost';
    }
  }

  return DEFAULT_HOST;
};

const YOUR_IP = getBackendHost();
const BASE_URL = USE_NGROK
  ? `${NGROK_URL}${API_PREFIX}`
  : `http://${YOUR_IP}:${PORT}${API_PREFIX}`;

console.log('📡 Platform:', Platform.OS);
console.log('📡 API Base URL:', BASE_URL);
console.log(USE_NGROK ? '🌐 Using NGROK tunnel' : '📶 Using local WiFi');

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