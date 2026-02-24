import api from './api';

const MovementService = {
  // Get all movements
  getMovements: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/movements?${queryString}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Create new movement (stock in/out)
  createMovement: async (movementData) => {
    try {
      const response = await api.post('/movements', movementData);
      return response;
    } catch (error) {
      throw error;
    }
  },
};

export default MovementService;