const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const {
  getActivities,
  getActivityById,
  getActivityStats,
  exportToCSV,
  exportToPDF
} = require('../controllers/activity.controller');

// All routes require authentication
router.use(authenticate);

// Activity routes
router.get('/', getActivities);
router.get('/stats', getActivityStats);
router.get('/export/csv', exportToCSV);
router.get('/export/pdf', exportToPDF);
router.get('/:id', getActivityById);

module.exports = router;

router.use(authenticate);

// Get activities (admin only)
router.get('/', authorize('ADMIN'), async (req, res) => {
  try {
    const prisma = require('../config/prisma');
    const activities = await prisma.activity.findMany({
      include: {
        user: { select: { name: true, email: true } },
        product: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    res.json({ success: true, data: activities });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;