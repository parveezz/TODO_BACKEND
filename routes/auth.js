const express = require('express');
const { register, login, googleLogin, getMe, updateDetails, updateSettings, deleteAccount } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.get('/me', protect, getMe);
router.put('/updatedetails', protect, updateDetails);
router.put('/settings', protect, updateSettings);
router.delete('/deleteaccount', protect, deleteAccount);

module.exports = router;
