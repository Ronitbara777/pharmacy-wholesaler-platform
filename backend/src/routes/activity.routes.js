const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');

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