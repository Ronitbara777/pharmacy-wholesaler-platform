const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticate } = require('../middleware/auth.middleware');
const {
  getMovements,
  getMovementById,
  createMovement,
  getMovementStats,
  importCSV,
  scanReceipt,
  batchCreateMovements
} = require('../controllers/movement.controller');

const upload = multer({ storage: multer.memoryStorage() });

// All routes require authentication
router.use(authenticate);

// IMPORTANT: Order matters - specific routes before dynamic ones
router.get('/stats', getMovementStats);  // This must come BEFORE /:id
router.post('/import', upload.single('file'), importCSV);
router.post('/scan', upload.single('receiptImage'), scanReceipt);
router.post('/batch', batchCreateMovements);
router.get('/', getMovements);
router.post('/', createMovement);
router.get('/:id', getMovementById);

module.exports = router;