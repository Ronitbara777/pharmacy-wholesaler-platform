const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticate } = require('../middleware/auth.middleware');
const {
  getMovements,
  getMovementById,
  createMovement,
  getMovementStats,
  importCSV
} = require('../controllers/movement.controller');

const upload = multer({ storage: multer.memoryStorage() });

// All routes require authentication
router.use(authenticate);

// Movement routes
router.get('/stats', getMovementStats);
router.post('/import', upload.single('file'), importCSV);
router.get('/', getMovements);
router.post('/', createMovement);
router.get('/:id', getMovementById);

module.exports = router;