const express = require('express');
const router = express.Router();
const { getQuotations, getQuotation, createQuotation, updateQuotation, generatePDF, sendEmail, deleteQuotation } = require('../controllers/quotation.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);
router.get('/', getQuotations);
router.post('/', createQuotation);
router.get('/:id', getQuotation);
router.put('/:id', updateQuotation);
router.post('/:id/generate-pdf', generatePDF);
router.post('/:id/send-email', sendEmail);
router.delete('/:id', deleteQuotation);

module.exports = router;
