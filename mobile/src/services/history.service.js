import api from './api';

const HistoryService = {
  // Get all activities with filters
  getActivities: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/activities?${queryString}`);
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

  // Export activities to PDF
  exportToPDF: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/activities/export/pdf?${queryString}`, {
        responseType: 'blob'
      });
      return response;
    } catch (error) {
      console.error('❌ Error exporting to PDF:', error);
      throw error;
    }
  },

  // Export activities to CSV
  exportToCSV: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/activities/export/csv?${queryString}`, {
        responseType: 'blob'
      });
      return response;
    } catch (error) {
      console.error('❌ Error exporting to CSV:', error);
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
  }
};

export default HistoryService;