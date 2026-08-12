const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController');
const { authMiddleware, adminOnly } = require('../middlewares/auth');

// Hanya admin yang bisa mengelola backup
router.use(authMiddleware, adminOnly);

router.get('/', backupController.getAll);
router.post('/', backupController.createBackup);
router.get('/download/:filename', backupController.downloadBackup);
router.delete('/:filename', backupController.remove);

module.exports = router;
