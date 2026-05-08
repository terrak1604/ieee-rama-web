const express = require('express');
const router = express.Router();
const { login, register, listUsers, updateUserPassword } = require('../controllers/authController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

router.post('/login', login);
router.post('/register', authMiddleware, roleMiddleware(['director_rama']), register);
router.get('/users', authMiddleware, roleMiddleware(['director_rama']), listUsers);
router.patch('/users/:id/password', authMiddleware, roleMiddleware(['director_rama']), updateUserPassword);

module.exports = router;
