const router = require('express').Router();
const { getAll, create, update, remove } = require('../controllers/userController');
const { authMiddleware, adminOnly } = require('../middlewares/auth');

router.get('/', authMiddleware, adminOnly, getAll);
router.post('/', authMiddleware, adminOnly, create);
router.put('/:id', authMiddleware, adminOnly, update);
router.delete('/:id', authMiddleware, adminOnly, remove);

module.exports = router;
