const express = require('express');
const router = express.Router();
const multer = require('multer');
const os = require('os');
const path = require('path');
const { authenticate } = require('../middleware/auth.middleware');
const {
  getMovements,
  getMovementById,
  createMovement,
  getMovementStats,
  importCSV,
  importPDF,
  scanReceipt,
  batchCreateMovements,
  getSalesData
} = require('../controllers/movement.controller');

const uploadMemory = multer({ storage: multer.memoryStorage() });
const uploadDisk = multer({ dest: path.join(os.tmpdir(), 'receipt-uploads') });

// All routes require authentication
router.use(authenticate);

// IMPORTANT: Order matters - specific routes before dynamic ones
router.get('/stats', getMovementStats);  // This must come BEFORE /:id
router.post('/import', uploadMemory.single('file'), importCSV);
router.post('/import-pdf', uploadMemory.single('file'), importPDF);
router.post('/scan', uploadMemory.single('receiptImage'), scanReceipt);
router.post('/batch', batchCreateMovements);
router.get('/sales-data', getSalesData);
router.get('/', getMovements);
router.post('/', createMovement);
router.get('/:id', getMovementById);

module.exports = router;