const express = require('express');
const router = express.Router();
const { poController } = require('../controllers/combined.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);
router.get('/', poController.getAll);
router.post('/', poController.create);
router.get('/:id', poController.getOne);
router.put('/:id', poController.update);

module.exports = router;
