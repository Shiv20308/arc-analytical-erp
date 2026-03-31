const express = require('express');
const router = express.Router();
const { getClients, getClient, createClient, updateClient, deleteClient, getAllClientsSimple } = require('../controllers/client.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect);
router.get('/all', getAllClientsSimple);
router.get('/', getClients);
router.post('/', createClient);
router.get('/:id', getClient);
router.put('/:id', updateClient);
router.delete('/:id', authorize('admin'), deleteClient);

module.exports = router;
