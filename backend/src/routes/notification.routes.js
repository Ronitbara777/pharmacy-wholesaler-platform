const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

// Get user notifications
router.get('/', async (req, res) => {
  try {
    const prisma = require('../config/prisma');
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark as read
router.patch('/:id/read', async (req, res) => {
  try {
    const prisma = require('../config/prisma');
    const notification = await prisma.notification.update({
      where: { id: req.params.id },
      data: { read: true }
    });
    res.json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;