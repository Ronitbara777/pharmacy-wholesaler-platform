import api from './api';

const WarehouseService = {
  // Get all warehouses
  getWarehouses: async () => {
    try {
      const response = await api.get('/warehouses');
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get warehouse by ID
  getWarehouseById: async (id) => {
    try {
      const response = await api.get(`/warehouses/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  },
};

export default WarehouseService;