const express = require('express');
const router = express.Router();
const { getAllPending, getHistory, approve, ignore } = require('../controllers/resetController');
const { authMiddleware, adminOnly } = require('../middlewares/auth');

// All reset routes are admin only
router.use(authMiddleware, adminOnly);

router.get('/pending', getAllPending);
router.get('/history', getHistory);
router.post('/approve', approve);
router.post('/ignore', ignore);

module.exports = router;
