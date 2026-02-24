const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticate } = require('../middleware/auth.middleware');

const upload = multer({ dest: 'uploads/' });

router.use(authenticate);

// Import CSV
router.post('/csv', upload.single('file'), async (req, res) => {
  try {
    // CSV parsing logic will go here
    res.json({ success: true, message: 'File uploaded' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;