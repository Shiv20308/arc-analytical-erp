const express = require('express');
const router = express.Router();
const { getContracts, getContract, createContract, updateContract, deleteContract, getExpiringContracts } = require('../controllers/contract.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);
router.get('/expiring', getExpiringContracts);
router.get('/', getContracts);
router.post('/', createContract);
router.get('/:id', getContract);
router.put('/:id', updateContract);
router.delete('/:id', deleteContract);

module.exports = router;
