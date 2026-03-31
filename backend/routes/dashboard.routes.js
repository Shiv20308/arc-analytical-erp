const express = require('express');
const router = express.Router();
const { dashboardController } = require('../controllers/combined.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);
router.get('/stats', dashboardController.getStats);

module.exports = router;
