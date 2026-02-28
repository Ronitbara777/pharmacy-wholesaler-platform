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

// Activity routes - ORDER MATTERS!
router.get('/stats', getActivityStats);  // Specific routes first
router.get('/export/csv', exportToCSV);
router.get('/export/pdf', exportToPDF);
router.get('/', getActivities);  // Generic list route
router.get('/:id', getActivityById);  // Parameterized route last

module.exports = router;