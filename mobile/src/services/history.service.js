import api from './api';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const HistoryService = {
  // Get all activities with filters
  getActivities: async (params = {}) => {
    try {
      // Remove undefined values
      const cleanParams = {};
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          cleanParams[key] = params[key];
        }
      });
      
      const queryString = new URLSearchParams(cleanParams).toString();
      const url = `/activities${queryString ? `?${queryString}` : ''}`;
      console.log('📋 API Request:', url);
      
      const response = await api.get(url);
      return response;
    } catch (error) {
      console.error('❌ Error fetching activities:', error);
      throw error;
    }
  },

  // Get activity by ID
  getActivityById: async (id) => {
    try {
      const response = await api.get(`/activities/${id}`);
      return response;
    } catch (error) {
      console.error('❌ Error fetching activity:', error);
      throw error;
    }
  },

  // Get activity statistics
  getActivityStats: async () => {
    try {
      const response = await api.get('/activities/stats');
      return response;
    } catch (error) {
      console.error('❌ Error fetching activity stats:', error);
      throw error;
    }
  },

  // Export activities to CSV
  // Export to CSV
exportToCSV: async (params = {}) => {
  try {
    // Remove undefined values
    const cleanParams = {};
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        cleanParams[key] = params[key];
      }
    });
    
    const queryString = new URLSearchParams(cleanParams).toString();
    const url = `/activities/export/csv${queryString ? `?${queryString}` : ''}`;
    console.log('📋 Export CSV URL:', url);
    
    const response = await api.get(url, {
      responseType: 'text'
    });
    
    // api interceptor already returns response.data
    console.log('📋 CSV response length:', response?.length);
    return response;
  } catch (error) {
    console.error('❌ Error exporting to CSV:', error);
    throw error;
  }
},

// Export to PDF
exportToPDF: async (params = {}) => {
  try {
    // Remove undefined values
    const cleanParams = {};
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        cleanParams[key] = params[key];
      }
    });
    
    const queryString = new URLSearchParams(cleanParams).toString();
    const url = `/activities/export/pdf${queryString ? `?${queryString}` : ''}`;
    console.log('📋 Export PDF URL:', url);
    
    const response = await api.get(url, {
      responseType: 'text'
    });
    
    console.log('📋 PDF response length:', response?.length);
    return response;
  } catch (error) {
    console.error('❌ Error exporting to PDF:', error);
    throw error;
  }
},

  // Export activities to PDF
  exportToPDF: async (params = {}) => {
    try {
      // Remove undefined values
      const cleanParams = {};
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          cleanParams[key] = params[key];
        }
      });
      
      const queryString = new URLSearchParams(cleanParams).toString();
      const url = `/activities/export/pdf${queryString ? `?${queryString}` : ''}`;
      console.log('📋 Export PDF URL:', url);
      
      const response = await api.get(url, {
        responseType: 'text'
      });
      
      return response;
    } catch (error) {
      console.error('❌ Error exporting to PDF:', error);
      throw error;
    }
  }
};

export default HistoryService;