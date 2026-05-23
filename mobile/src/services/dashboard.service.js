import api from './api';

const DashboardService = {
  // Get dashboard statistics
  getStats: async () => {
    try {
      const response = await api.get('/products/stats');
      return response;
    } catch (error) {
      console.error('❌ Error fetching dashboard stats:', error);
      throw error;
    }
  },

  // Get expiring products
  getExpiringProducts: async (days = 30) => {
    try {
      const response = await api.get('/products', {
        params: {
          status: 'ACTIVE',
          sortBy: 'expiryDate',
          sortOrder: 'asc',
          limit: 10
        }
      });
      // Filter expiring products client-side or let backend handle it
      return response;
    } catch (error) {
      console.error('❌ Error fetching expiring products:', error);
      throw error;
    }
  },

  // Get recent activities
  getRecentActivities: async (limit = 10) => {
    try {
      const response = await api.get('/activities', {
        params: { limit }
      });
      return response;
    } catch (error) {
      console.error('❌ Error fetching activities:', error);
      throw error;
    }
  },

  // Get warehouse utilization
  getWarehouses: async () => {
    try {
      const response = await api.get('/warehouses');
      return response;
    } catch (error) {
      console.error('❌ Error fetching warehouses:', error);
      throw error;
    }
  },

  // Get sales data
  getSalesData: async () => {
    try {
      const response = await api.get('/movements/sales-data');
      return response;
    } catch (error) {
      console.error('❌ Error fetching sales data:', error);
      throw error;
    }
  }
};

export default DashboardService;