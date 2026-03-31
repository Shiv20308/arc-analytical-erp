const express = require('express');
const router = express.Router();
const { invoiceController } = require('../controllers/combined.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);
router.get('/', invoiceController.getAll);
router.post('/', invoiceController.create);
router.get('/:id', invoiceController.getOne);
router.put('/:id', invoiceController.update);
router.post('/:id/generate-pdf', invoiceController.generatePDF);

module.exports = router;
