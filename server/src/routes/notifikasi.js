const express = require('express');
const router = express.Router();
const notifikasiController = require('../controllers/notifikasiController');
const { authMiddleware } = require('../middlewares/auth');

router.get('/', authMiddleware, notifikasiController.getNotifikasi);
router.put('/read-all', authMiddleware, notifikasiController.markAllAsRead);
router.put('/:id/read', authMiddleware, notifikasiController.markAsRead);

module.exports = router;
