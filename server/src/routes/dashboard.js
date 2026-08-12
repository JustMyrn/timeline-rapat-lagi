const router = require('express').Router();
const { getStats, getUpcoming, getDepartmentStats } = require('../controllers/dashboardController');
const { authMiddleware } = require('../middlewares/auth');

router.get('/stats', authMiddleware, getStats);
router.get('/upcoming', authMiddleware, getUpcoming);
router.get('/department-stats', authMiddleware, getDepartmentStats);

module.exports = router;
