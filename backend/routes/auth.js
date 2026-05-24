const express = require('express');
const router = express.Router();
const { login, register, listUsers, updateUserPassword, updateUsuario, deleteUsuario } = require('../controllers/authController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

router.post('/login', login);
router.post('/register', authMiddleware, roleMiddleware(['director_rama']), register);
router.get('/users', authMiddleware, roleMiddleware(['director_rama']), listUsers);
router.patch('/users/:id/password', authMiddleware, roleMiddleware(['director_rama']), updateUserPassword);
router.put('/users/:id', authMiddleware, roleMiddleware(['director_rama']), updateUsuario);
router.delete('/users/:id', authMiddleware, roleMiddleware(['director_rama']), deleteUsuario);

module.exports = router;
