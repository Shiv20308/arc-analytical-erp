const express = require('express');
const router = express.Router();
const { userController } = require('../controllers/combined.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');

router.use(protect);
router.get('/', adminOnly, userController.getAll);
router.put('/:id', adminOnly, userController.update);
router.delete('/:id', adminOnly, userController.deactivate);

module.exports = router;
