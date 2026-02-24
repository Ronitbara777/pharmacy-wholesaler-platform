const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticate);

// Get all warehouses
router.get('/', async (req, res) => {
  try {
    const prisma = require('../config/prisma');
    const warehouses = await prisma.warehouse.findMany({
      include: {
        _count: {
          select: { products: true, users: true }
        }
      }
    });
    res.json({ success: true, data: warehouses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get warehouse by ID
router.get('/:id', async (req, res) => {
  try {
    const prisma = require('../config/prisma');
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: req.params.id },
      include: {
        products: true,
        users: {
          select: { id: true, name: true, email: true }
        }
      }
    });
    if (!warehouse) {
      return res.status(404).json({ success: false, message: 'Warehouse not found' });
    }
    res.json({ success: true, data: warehouse });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;