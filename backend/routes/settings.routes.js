const express = require('express');
const router = express.Router();
const { settingsController } = require('../controllers/combined.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

router.use(protect);
router.get('/', settingsController.get);
router.put('/', adminOnly, settingsController.update);
router.post('/logo', adminOnly, upload.single('logo'), settingsController.uploadLogo);

module.exports = router;
