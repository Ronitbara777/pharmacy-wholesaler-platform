const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications
} = require('../controllers/notification.controller');

// All routes require authentication
router.use(authenticate);

// Notification routes
// Notification routes - ORDER MATTERS!
router.get('/', getNotifications);
router.get('/unread/count', getUnreadCount);

// Specific actions first (these are not IDs)
router.delete('/clear-all', clearAllNotifications);  // This must come BEFORE /:id
router.post('/mark-all-read', markAllAsRead);

// Parameterized routes last
router.patch('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

module.exports = router;