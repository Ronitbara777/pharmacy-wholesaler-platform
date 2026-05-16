import api from './api';

const MovementService = {
  // Get all stock movements with filters
  getMovements: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/movements?${queryString}`);
      return response;
    } catch (error) {
      console.error('❌ Error fetching movements:', error);
      throw error;
    }
  },

  // Get movement by ID
  getMovementById: async (id) => {
    try {
      const response = await api.get(`/movements/${id}`);
      return response;
    } catch (error) {
      console.error('❌ Error fetching movement:', error);
      throw error;
    }
  },

  // Create new stock movement (IN or OUT)
  createMovement: async (movementData) => {
    try {
      const response = await api.post('/movements', movementData);
      return response;
    } catch (error) {
      console.error('❌ Error creating movement:', error);
      throw error;
    }
  },

  // Get movement statistics
  getMovementStats: async () => {
    try {
      const response = await api.get('/movements/stats');
      return response;
    } catch (error) {
      console.error('❌ Error fetching movement stats:', error);
      throw error;
    }
  },

  // Import movements from CSV
  importCSV: async (formData) => {
    try {
      const response = await api.post('/movements/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response;
    } catch (error) {
      console.error('❌ Error importing CSV:', error);
      throw error;
    }
  },

  // Scan receipt image for OCR parsing
  scanReceipt: async (formData) => {
    try {
      const response = await api.post('/movements/scan', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response;
    } catch (error) {
      console.error('❌ Error scanning receipt:', error);
      throw error;
    }
  },

  // Create batch movements from scanned receipt items
  createBatchMovements: async (items) => {
    try {
      const response = await api.post('/movements/batch', { items });
      return response;
    } catch (error) {
      console.error('❌ Error creating batch movements:', error);
      throw error;
    }
  },

  // Get products for dropdown
  getProducts: async () => {
    try {
      const response = await api.get('/products?limit=1000');
      return response;
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      throw error;
    }
  },

  // Get warehouses for dropdown
  getWarehouses: async () => {
    try {
      const response = await api.get('/warehouses');
      return response;
    } catch (error) {
      console.error('❌ Error fetching warehouses:', error);
      throw error;
    }
  }
};

export default MovementService;