const express = require('express');
const router = express.Router();
const { followupController } = require('../controllers/combined.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);
router.get('/', followupController.getAll);
router.post('/', followupController.create);
router.put('/:id', followupController.update);

module.exports = router;
