const router = require('express').Router();
const { getAll } = require('../controllers/logController');
const { authMiddleware, adminOnly } = require('../middlewares/auth');

router.get('/', authMiddleware, adminOnly, getAll);

module.exports = router;
