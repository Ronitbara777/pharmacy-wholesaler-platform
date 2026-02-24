import api from './api';

const ActivityService = {
  // Get activities (admin only)
  getActivities: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/activities?${queryString}`);
      return response;
    } catch (error) {
      throw error;
    }
  },
};

export default ActivityService;