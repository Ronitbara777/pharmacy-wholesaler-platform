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
router.get('/unread/count', getUnreadCount);
router.post('/mark-all-read', markAllAsRead);
router.delete('/clear-all', clearAllNotifications);

router.get('/', getNotifications);
router.patch('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

module.exports = router;