const express = require('express');
const router = express.Router();
const { login, signup, register, getMe, changePassword } = require('../controllers/auth.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');

router.post('/login', login);
router.post('/signup', signup);          // public self-registration
router.post('/register', protect, adminOnly, register);  // admin creates users
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);

module.exports = router;
