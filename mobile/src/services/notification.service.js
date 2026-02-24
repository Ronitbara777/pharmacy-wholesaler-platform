import api from './api';

const NotificationService = {
  // Get user notifications
  getNotifications: async () => {
    try {
      const response = await api.get('/notifications');
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Mark notification as read
  markAsRead: async (id) => {
    try {
      const response = await api.patch(`/notifications/${id}/read`);
      return response;
    } catch (error) {
      throw error;
    }
  },
};

export default NotificationService;