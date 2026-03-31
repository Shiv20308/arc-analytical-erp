const express = require('express');
const router = express.Router();
const { visitController } = require('../controllers/combined.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);
router.get('/', visitController.getAll);
router.post('/', visitController.create);
router.get('/:id', visitController.getOne);
router.put('/:id', visitController.update);

module.exports = router;
