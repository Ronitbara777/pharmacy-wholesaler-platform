const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

// Get all movements
router.get('/', async (req, res) => {
  try {
    const prisma = require('../config/prisma');
    const movements = await prisma.stockMovement.findMany({
      include: {
        product: { select: { name: true, batchNumber: true } },
        user: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: movements });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create movement
router.post('/', async (req, res) => {
  try {
    const prisma = require('../config/prisma');
    const movement = await prisma.stockMovement.create({
      data: {
        ...req.body,
        userId: req.user.id
      }
    });
    res.json({ success: true, data: movement });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;