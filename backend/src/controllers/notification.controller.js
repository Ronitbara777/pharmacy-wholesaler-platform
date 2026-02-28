const prisma = require('../config/prisma');

// Get all notifications for current user
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            batchNumber: true,
            expiryDate: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('❌ Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get unread count
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const count = await prisma.notification.count({
      where: {
        userId,
        read: false
      }
    });

    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('❌ Error fetching unread count:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const notification = await prisma.notification.updateMany({
      where: {
        id,
        userId
      },
      data: { read: true }
    });

    if (notification.count === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Notification not found' 
      });
    }

    // Log activity
    await prisma.activity.create({
      data: {
        action: 'UPDATE',
        entityType: 'NOTIFICATION',
        entityId: id,
        userId: req.user.id,
        details: { action: 'mark_as_read' },
        ipAddress: req.ip,
        device: req.headers['user-agent']
      }
    });

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Mark all as read
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        read: false
      },
      data: { read: true }
    });

    // Log activity
    await prisma.activity.create({
      data: {
        action: 'UPDATE',
        entityType: 'NOTIFICATION',
        userId: req.user.id,
        details: { action: 'mark_all_as_read', count: result.count },
        ipAddress: req.ip,
        device: req.headers['user-agent']
      }
    });

    res.json({
      success: true,
      message: `Marked ${result.count} notifications as read`,
      data: { count: result.count }
    });
  } catch (error) {
    console.error('❌ Error marking all as read:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // First get the notification to log details
    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!notification) {
      return res.status(404).json({ 
        success: false, 
        message: 'Notification not found' 
      });
    }

    // Delete the notification
    await prisma.notification.delete({
      where: { id }
    });

    // Log activity
    await prisma.activity.create({
      data: {
        action: 'DELETE',
        entityType: 'NOTIFICATION',
        entityId: id,
        userId: req.user.id,
        details: { 
          title: notification.title,
          type: notification.type
        },
        ipAddress: req.ip,
        device: req.headers['user-agent']
      }
    });

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting notification:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Clear all notifications - FIXED VERSION
const clearAllNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('🗑️ Clearing all notifications for user:', userId);
    
    // First check if there are any notifications
    const notifications = await prisma.notification.findMany({
      where: { userId }
    });
    
    console.log(`📊 Found ${notifications.length} notifications`);

    if (notifications.length === 0) {
      return res.json({
        success: true,
        message: 'No notifications to clear',
        data: { count: 0 }
      });
    }

    // Delete all notifications for user
    const result = await prisma.notification.deleteMany({
      where: { userId }
    });

    console.log(`✅ Deleted ${result.count} notifications`);

    // Log activity
    await prisma.activity.create({
      data: {
        action: 'DELETE',
        entityType: 'NOTIFICATION',
        userId: req.user.id,
        details: { action: 'clear_all', count: result.count },
        ipAddress: req.ip,
        device: req.headers['user-agent']
      }
    });

    res.json({
      success: true,
      message: `Successfully cleared ${result.count} notifications`,
      data: { count: result.count }
    });

  } catch (error) {
    console.error('❌ Error clearing notifications:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications
};