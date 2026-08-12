const router = require('express').Router();
const { getAll, getTv, getById, create, createBulk, update, remove } = require('../controllers/rapatController');
const { authMiddleware } = require('../middlewares/auth');

// TV display — public (no auth needed)
router.get('/tv', getTv);

// Protected routes
router.get('/', authMiddleware, getAll);
router.get('/:id', authMiddleware, getById);
router.post('/', authMiddleware, create);
router.post('/bulk', authMiddleware, createBulk);
router.put('/:id', authMiddleware, update);
router.delete('/:id', authMiddleware, remove);

module.exports = router;
