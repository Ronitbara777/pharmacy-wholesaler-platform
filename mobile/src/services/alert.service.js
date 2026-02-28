import api from './api';

const AlertService = {
  // Get all notifications for current user
  getNotifications: async () => {
    try {
      const response = await api.get('/notifications');
      return response;
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      throw error;
    }
  },

  // Get unread count
  getUnreadCount: async () => {
    try {
      const response = await api.get('/notifications/unread/count');
      return response;
    } catch (error) {
      console.error('❌ Error getting unread count:', error);
      throw error;
    }
  },

  // Mark notification as read
  markAsRead: async (id) => {
    try {
      const response = await api.patch(`/notifications/${id}/read`);
      return response;
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      throw error;
    }
  },

  // Mark all as read
  markAllAsRead: async () => {
    try {
      const response = await api.post('/notifications/mark-all-read');
      return response;
    } catch (error) {
      console.error('❌ Error marking all as read:', error);
      throw error;
    }
  },

  // Delete notification
  deleteNotification: async (id) => {
    try {
      const response = await api.delete(`/notifications/${id}`);
      return response;
    } catch (error) {
      console.error('❌ Error deleting notification:', error);
      throw error;
    }
  },

  // Clear all notifications
  clearAllNotifications: async () => {
    try {
      const response = await api.delete('/notifications/clear-all');
      return response;
    } catch (error) {
      console.error('❌ Error clearing all notifications:', error);
      throw error;
    }
  }
};

export default AlertService;