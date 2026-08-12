const router = require('express').Router();
const { login, me, resetRequest, changePassword } = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/auth');

router.post('/login', login);
router.get('/me', authMiddleware, me);
router.post('/reset-request', resetRequest);
router.put('/change-password', authMiddleware, changePassword);

module.exports = router;
